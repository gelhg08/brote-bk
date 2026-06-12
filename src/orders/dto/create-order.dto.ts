import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  productSlug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  variantSku!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

/** Lo que envía el frontend al crear una orden (checkout invitado). */
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName!: string;

  @IsEmail()
  @MaxLength(160)
  customerEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerDocument?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shippingAddress!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  shippingCity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shippingState?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingNotes?: string;
}
