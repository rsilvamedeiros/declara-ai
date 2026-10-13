import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { AuthGuard, OwnerId } from '../identity'
import {
  parseCorrectionBody,
  parseManualFieldBody,
  parseYear,
  toWireField,
} from './http-schema'
import { TaxDataService } from './tax-data.service'

@Controller()
@UseGuards(AuthGuard)
export class TaxDataController {
  constructor(private readonly service: TaxDataService) {}

  @Post('fields')
  async create(@OwnerId() ownerId: string, @Body() body: unknown) {
    return toWireField(await this.service.enterManualField(ownerId, parseManualFieldBody(body)))
  }

  @Get('people/:personId/years/:year/fields')
  async list(
    @OwnerId() ownerId: string,
    @Param('personId') personId: string,
    @Param('year') year: string,
  ) {
    const stored = await this.service.listFields(ownerId, personId, parseYear(year))
    return stored.map(toWireField)
  }

  @Post('fields/:id/confirm')
  async confirm(@OwnerId() ownerId: string, @Param('id') id: string) {
    return toWireField(await this.service.confirm(ownerId, id))
  }

  @Post('fields/:id/correct')
  async correct(@OwnerId() ownerId: string, @Param('id') id: string, @Body() body: unknown) {
    return toWireField(await this.service.correct(ownerId, id, parseCorrectionBody(body)))
  }

  @Post('fields/:id/reject')
  async reject(@OwnerId() ownerId: string, @Param('id') id: string) {
    return toWireField(await this.service.reject(ownerId, id))
  }

  @Get('people/:personId/years/:year/alerts')
  async alerts(
    @OwnerId() ownerId: string,
    @Param('personId') personId: string,
    @Param('year') year: string,
  ) {
    return this.service.consistencyAlerts(ownerId, personId, parseYear(year))
  }
}
