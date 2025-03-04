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
      data: {...createLocationDto, coordinates: JSON.stringify(createLocationDto.coordinates)},
    });
    return location;
  }

  async findAll(filterDto: FilterLocationDto) {
    const filters: any = {};

    if (filterDto.name) {
      filters.name = { contains: filterDto.name };
    }

    if (filterDto.country) {
      filters.country = { contains: filterDto.country };
    }

    if (filterDto.city) {
      filters.city = { contains: filterDto.city };
    }

    if (filterDto.ip) {
      filters.ip = { contains: filterDto.ip };
    }

    return this.prisma.location.findMany({
      where: filters,
    });
  }

  async findAllForClient(filterDto: FilterLocationDto) {
    const filters: any = {};

    if (filterDto.name) {
      filters.name = { contains: filterDto.name };
    }

    if (filterDto.country) {
      filters.country = { contains: filterDto.country };
    }

    if (filterDto.city) {
      filters.city = { contains: filterDto.city };
    }

    if (filterDto.ip) {
      filters.ip = { contains: filterDto.ip };
    }

    const locations = await this.prisma.location.findMany({
      where: filters,
    });

    const groupedByCountry = locations.reduce((acc, location) => {
      const country = location.country;
      if (!acc[country]) {
        acc[country] = {
          country,
          count: 0,
          locations: []
        };
      }
      acc[country].count++;
      acc[country].locations.push(location);
      return acc;
    }, {});

    const result = Object.values(groupedByCountry).map((countryGroup: any) => {
      const location = countryGroup.locations[0];
      const coordinates = JSON.parse(location.coordinates);

      return {
        label: location.name,
        country: location.country,
        key: `${location.name} ${location.id}`,
        amount: countryGroup.count,
        location: coordinates,
      };
    });

    return result;
  }

  async findOne(id: string) {
    return this.prisma.location.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateLocationDto: UpdateLocationDto) {
    return this.prisma.location.update({
      where: { id },
      data: {...updateLocationDto, coordinates: JSON.stringify(updateLocationDto.coordinates)},
    });
  }

  async remove(id: string) {
    return this.prisma.location.delete({
      where: { id },
    });
  }
}
