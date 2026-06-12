import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: { findAll: jest.Mock; findBySlug: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn(), findBySlug: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get(ProductsController);
  });

  it('GET /products delega en findAll con la query', () => {
    const query = { page: 1, limit: 20, category: 'mugs' };
    service.findAll.mockReturnValue('ok');
    expect(controller.findAll(query)).toBe('ok');
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('GET /products/:slug delega en findBySlug', () => {
    service.findBySlug.mockReturnValue('producto');
    expect(controller.findOne('mug-clasico')).toBe('producto');
    expect(service.findBySlug).toHaveBeenCalledWith('mug-clasico');
  });
});
