export class SeatManager {
  private seats: Map<string, number> = new Map(); // LicenseKey -> ActiveSeats
  private limits: Map<string, number> = new Map(); // LicenseKey -> MaxSeats

  constructor() {}

  registerLicense(licenseKey: string, maxSeats: number) {
    this.limits.set(licenseKey, maxSeats);
    if (!this.seats.has(licenseKey)) {
      this.seats.set(licenseKey, 0);
    }
  }

  allocateSeat(licenseKey: string): boolean {
    const current = this.seats.get(licenseKey) || 0;
    const max = this.limits.get(licenseKey) || 1;

    if (current < max) {
      this.seats.set(licenseKey, current + 1);
      return true;
    }
    return false;
  }

  releaseSeat(licenseKey: string) {
    const current = this.seats.get(licenseKey) || 0;
    if (current > 0) {
      this.seats.set(licenseKey, current - 1);
    }
  }

  getSeatUsage(licenseKey: string): { current: number; max: number } {
    return {
      current: this.seats.get(licenseKey) || 0,
      max: this.limits.get(licenseKey) || 0,
    };
  }
}
