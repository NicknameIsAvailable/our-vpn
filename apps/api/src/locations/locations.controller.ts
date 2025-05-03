import { Controller, Get, Post, Body, Param, Put, Delete, Query, Req } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { FilterLocationDto } from './dto/filter-location.dto';
import { Auth } from '../auth/guards/decorators/auth.decorator';
import { OptionalAuth } from '../optional-jwt-auth/optional-jwt-auth.decorator';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Auth()
  @Post()
  create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.create(createLocationDto);
  }

  @OptionalAuth()
  @Get()
  findAll(@Query() filterDto: FilterLocationDto, @Req() request: any) {
    const {user} = request;
    console.log({ user})

    if (user)
      return this.locationsService.findAll(filterDto);
    return this.locationsService.findAllForClient(filterDto);
  }

  @OptionalAuth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }

  @OptionalAuth()
  @Put(':id')
  update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
