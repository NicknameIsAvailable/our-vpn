import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from '@nash-vpn/db';
import { FilterLocationDto } from './dto/filter-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLocationDto: CreateLocationDto) {
    const location = await this.prisma.location.create({
      data: createLocationDto,
    });
    return location;
  }

  async findAll(filterDto: FilterLocationDto) {
    const filters: any = {};

    if (filterDto.name) {
      filters.name = { contains: filterDto.name }; // Поиск по имени (частичное совпадение)
    }

    if (filterDto.country) {
      filters.country = { contains: filterDto.country }; // Поиск по стране
    }

    if (filterDto.city) {
      filters.city = { contains: filterDto.city }; // Поиск по городу
    }

    if (filterDto.ip) {
      filters.ip = { contains: filterDto.ip }; // Поиск по IP
    }

    if (filterDto.isActive !== undefined) {
      filters.isActive = filterDto.isActive; // Фильтрация по активности
    }

    if (filterDto.bandwidthLimit) {
      filters.bandwidthLimit = filterDto.bandwidthLimit; // Фильтрация по bandwidthLimit
    }

    if (filterDto.currentLoad) {
      filters.currentLoad = { lte: filterDto.currentLoad }; // Фильтрация по текущей нагрузке
    }

    return this.prisma.location.findMany({
      where: filters,
    });
  }

  async findOne(id: string) {
    return this.prisma.location.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateLocationDto: UpdateLocationDto) {
    return this.prisma.location.update({
      where: { id },
      data: updateLocationDto,
    });
  }

  async remove(id: string) {
    return this.prisma.location.delete({
      where: { id },
    });
  }
}
