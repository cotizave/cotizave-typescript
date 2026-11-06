# NestJS example

A thin injectable service around the SDK.

1. Install the SDK:

   ```bash
   npm install @cotizave/sdk
   ```

2. Set `COTIZAVE_API_KEY` in your server environment.

3. Register the provider and inject it:

   ```ts
   // app.module.ts
   import { Module } from '@nestjs/common';
   import { CotizaveService } from './cotizave.service';

   @Module({ providers: [CotizaveService], exports: [CotizaveService] })
   export class AppModule {}
   ```

   ```ts
   // some.controller.ts
   @Controller('rates')
   export class RatesController {
     constructor(private readonly cotizave: CotizaveService) {}

     @Get(':cc')
     list(@Param('cc') cc: string) {
       return this.cotizave.listRates(cc);
     }
   }
   ```
