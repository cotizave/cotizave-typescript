import { Resource, cc } from './base';
import type { RequestConfig } from '../transport';
import type { paths } from '../types/generated';

type HolidaysUnion =
  paths['/v2/holidays/{cc}']['get']['responses']['200']['content']['application/json'];

/** Year-mode response: `{ country, year, holidays }`. */
export type HolidaysYear = Extract<HolidaysUnion, { holidays: unknown }>;
/** Is-holiday response: `{ country, date, is_holiday, holiday }`. */
export type HolidayCheck = Extract<HolidaysUnion, { is_holiday: unknown }>;
/** Next-holiday response: `{ country, from, days_until, holiday }`. */
export type NextHoliday = Extract<HolidaysUnion, { days_until: unknown }>;
/** Business-days response: `{ country, from, days, result }`. */
export type BusinessDaysResult =
  paths['/v2/holidays/{cc}/business-days']['get']['responses']['200']['content']['application/json'];

/** Holiday calendars and business-day math (Basic+ in v2). */
export class HolidaysResource extends Resource {
  /**
   * Holidays for a year (defaults to the current year server-side).
   *
   * @example
   * const { holidays } = await client.holidays.list('AR', { year: 2026 });
   */
  list(country: string, options: { year?: number } = {}, config?: RequestConfig): Promise<HolidaysYear> {
    return this.transport.get<HolidaysYear>(`/v2/holidays/${cc(country)}`, { year: options.year }, config);
  }

  /** Whether a given date is a holiday. */
  check(country: string, date: string, config?: RequestConfig): Promise<HolidayCheck> {
    return this.transport.get<HolidayCheck>(`/v2/holidays/${cc(country)}`, { date }, config);
  }

  /** The next holiday on or after `from`. */
  next(country: string, from: string, config?: RequestConfig): Promise<NextHoliday> {
    return this.transport.get<NextHoliday>(`/v2/holidays/${cc(country)}`, { from }, config);
  }

  /**
   * The date reached by adding `days` business days to `from`.
   *
   * @example
   * const { result } = await client.holidays.businessDays('VE', { from: '2026-10-01', days: 5 });
   */
  async businessDays(
    country: string,
    options: { days: number; from?: string },
    config?: RequestConfig,
  ): Promise<BusinessDaysResult> {
    if (!(typeof options?.days === 'number' && Number.isInteger(options.days) && options.days >= 0)) {
      throw new TypeError('businessDays: `days` must be a non-negative integer.');
    }
    return this.transport.get<BusinessDaysResult>(
      `/v2/holidays/${cc(country)}/business-days`,
      {
        from: options.from,
        days: options.days,
      },
      config,
    );
  }
}
