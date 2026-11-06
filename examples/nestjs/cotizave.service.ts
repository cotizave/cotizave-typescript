// NestJS — wrap the SDK in an injectable provider.
//
// Register CotizaveService in a module's `providers`, then inject it anywhere.
// The API key comes from configuration (environment), never from source.
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cotizave } from '@cotizave/sdk';

@Injectable()
export class CotizaveService implements OnModuleInit {
  private client!: Cotizave;

  onModuleInit(): void {
    const apiKey = process.env.COTIZAVE_API_KEY;
    if (!apiKey) throw new Error('COTIZAVE_API_KEY is not set.');
    this.client = new Cotizave({ apiKey });
  }

  listRates(country: string) {
    return this.client.rates.list(country);
  }

  convert(from: string, to: string, amount: number) {
    return this.client.convert({ from, to, amount });
  }
}
