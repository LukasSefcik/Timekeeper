import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

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

@Component({
  selector: 'app-timekeeper',
  imports: [ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <form [formGroup]="form" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-700">Začiatok</span>
          <input
            type="time"
            formControlName="startTime"
            class="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-700">Prestávka (min)</span>
          <input
            type="number"
            inputmode="numeric"
            min="0"
            step="5"
            formControlName="breakMinutes"
            class="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium text-slate-700">Nadčas (h)</span>
          <input
            type="number"
            inputmode="decimal"
            min="0"
            step="0.25"
            formControlName="overtimeHours"
            class="h-10 rounded-md border border-slate-300 bg-white px-3 text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </form>

      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div class="text-sm text-slate-600">Povinný čas</div>
        <div class="mt-1 text-2xl font-semibold text-slate-900">8:00 h</div>
        <div class="mt-4 text-sm text-slate-600">Koniec práce</div>
        <div class="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {{ endTime().time }}
          @if (endTime().dayOffset > 0) {
            <span class="ml-2 align-middle text-base font-medium text-slate-600">(+{{ endTime().dayOffset }} deň)</span>
          }
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
  private readonly formBuilder = inject(FormBuilder);

  protected readonly form = this.formBuilder.nonNullable.group({
    startTime: this.formBuilder.nonNullable.control<string>('09:00', {
      validators: [Validators.pattern(/^\d{2}:\d{2}$/)],
    }),
    breakMinutes: this.formBuilder.nonNullable.control<number>(30, {
      validators: [Validators.min(0)],
    }),
    overtimeHours: this.formBuilder.nonNullable.control<number>(0, {
      validators: [Validators.min(0)],
    }),
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  private readonly workdayMinutes = 8 * 60;

  protected readonly endTime = computed(() => {
    const { startTime, breakMinutes, overtimeHours } = this.formValue();
    const startMinutes = parseTimeToMinutes(startTime ?? '09:00');
    const breakMins = Math.max(0, Number(breakMinutes ?? 0));
    const overtimeMins = Math.max(0, Number(overtimeHours ?? 0)) * 60;
    const total = startMinutes + this.workdayMinutes + breakMins + overtimeMins;
    return formatMinutesToTime(total);
  });
}

