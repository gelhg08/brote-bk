import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Query params para GET /products (filtros + paginación offset). */
export class QueryProductsDto {
  /** slug de categoría (ej. "termos"). */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  /** búsqueda por nombre (contiene, case-insensitive por collation MySQL). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
