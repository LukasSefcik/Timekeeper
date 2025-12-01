import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Field, form, min, pattern } from '@angular/forms/signals';

function parseTimeToMinutes(time24h: string): number {
  const [hoursStr, minutesStr] = time24h.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr ?? 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number): { time: string; dayOffset: number } {
  const minutesInDay = 24 * 60;
  const normalized = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const dayOffset = Math.floor(totalMinutes / minutesInDay);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return { time: `${hh}:${mm}`, dayOffset };
}

export interface ViewModel {
  startTime: string;
  breakMinutes: number;
  overtimeHours: number;
}

const initialState: ViewModel = {
  startTime: '08:00',
  breakMinutes: 30,
  overtimeHours: 0,
};

@Component({
  selector: 'app-timekeeper',
  imports: [ReactiveFormsModule, Field],
  template: `
    <section class="grid gap-6 sm:grid-cols-2">
      <div
        class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <form class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">Začiatok</span>
            <input
              type="time"
              [field]="formSignal.startTime"
              autofocus
              class="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="button"
              (click)="setNowStartTime()"
              class="mt-1 w-fit text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Nastaviť na teraz
            </button>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200"
              >Prestávka (min)</span
            >
            <input
              type="number"
              inputmode="numeric"
              step="5"
              [field]="formSignal.breakMinutes"
              placeholder="0"
              class="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                (click)="setBreakMinutes(0)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                0
              </button>
              <button
                type="button"
                (click)="setBreakMinutes(15)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                15
              </button>
              <button
                type="button"
                (click)="setBreakMinutes(30)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                30
              </button>
              <button
                type="button"
                (click)="setBreakMinutes(45)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                45
              </button>
              <button
                type="button"
                (click)="setBreakMinutes(60)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                60
              </button>
            </div>
          </label>

          <label class="flex flex-col gap-1 sm:col-span-2">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">Nadčas (h)</span>
            <input
              type="number"
              inputmode="decimal"
              step="0.25"
              [field]="formSignal.overtimeHours"
              placeholder="0.00"
              class="h-11 rounded-md border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <div class="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                (click)="setOvertimeHours(0)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                0
              </button>
              <button
                type="button"
                (click)="setOvertimeHours(1)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                +1h
              </button>
              <button
                type="button"
                (click)="setOvertimeHours(2)"
                class="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                +2h
              </button>
            </div>
          </label>

          <div class="mt-2 flex items-center gap-2 sm:col-span-2">
            <button
              type="button"
              (click)="resetForm()"
              class="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Obnoviť
            </button>
          </div>
        </form>
      </div>

      <div
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      >
        <div class="text-sm text-slate-600 dark:text-slate-400">Povinný čas</div>
        <div class="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">8:00 h</div>
        <div class="mt-5 flex items-center justify-between">
          <div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Koniec práce</div>
            <div class="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {{ endTime().time }}
              @if (endTime().dayOffset > 0) {
                <span
                  class="ml-2 align-middle text-base font-medium text-slate-600 dark:text-slate-400"
                  >(+{{ endTime().dayOffset }} deň)</span
                >
              }
            </div>
          </div>
          <button
            type="button"
            (click)="copyEndTime()"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Kopírovať
          </button>
        </div>
      </div>
    </section>
  `,
  host: {
    class: 'block',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimekeeperComponent {
  protected readonly viewModel = signal<ViewModel>(initialState);
  protected readonly formSignal = form(this.viewModel, (schemaPath) => {
    pattern(schemaPath.startTime, /^\d{2}:\d{2}$/);
    min(schemaPath.breakMinutes, 0);
    min(schemaPath.overtimeHours, 0);
  });

  private readonly workdayMinutes = 8 * 60;

  protected readonly endTime = computed(() => {
    const { startTime, breakMinutes, overtimeHours } = this.viewModel();
    const startMinutes = parseTimeToMinutes(startTime ?? '08:00');
    const breakMins = Math.max(0, Number(breakMinutes ?? 0));
    const overtimeMins = Math.max(0, Number(overtimeHours ?? 0)) * 60;
    const total = startMinutes + this.workdayMinutes + breakMins + overtimeMins;
    return formatMinutesToTime(total);
  });

  protected setNowStartTime(): void {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.formSignal.startTime().setControlValue(`${hh}:${mm}`);
  }

  protected setBreakMinutes(minutes: number): void {
    this.formSignal.breakMinutes().setControlValue(Math.max(0, Math.floor(minutes)));
  }

  protected setOvertimeHours(hours: number): void {
    this.formSignal.overtimeHours().setControlValue(Math.max(0, hours));
  }

  protected resetForm(): void {
    this.formSignal.startTime().reset('08:00');
    this.formSignal.breakMinutes().reset(30);
    this.formSignal.overtimeHours().reset(0);
  }

  protected async copyEndTime(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.endTime().time);
    } catch {}
  }
}
