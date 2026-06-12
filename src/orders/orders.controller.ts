import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponse } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** POST /api/v1/orders — crea la orden (invitado) y devuelve orden + wompiConfig. */
  @Post()
  create(@Body() dto: CreateOrderDto): Promise<OrderResponse> {
    return this.orders.create(dto);
  }

  /** GET /api/v1/orders/:id — estado/detalle de la orden. */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<OrderResponse> {
    return this.orders.findById(id);
  }
}
