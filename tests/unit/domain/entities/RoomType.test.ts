import { RoomType, ROOM_TYPE_LABELS, ROOM_TYPE_COLORS } from '@/domain/entities/RoomType';

describe('RoomType', () => {
  describe('enum values', () => {
    it('should have all expected room types', () => {
      expect(Object.values(RoomType)).toEqual([
        'bedroom',
        'kitchen',
        'bathroom',
        'living_room',
        'exterior',
        'other'
      ]);
    });
  });

  describe('ROOM_TYPE_LABELS', () => {
    it('should have labels for all room types', () => {
      Object.values(RoomType).forEach(roomType => {
        expect(ROOM_TYPE_LABELS[roomType]).toBeDefined();
        expect(typeof ROOM_TYPE_LABELS[roomType]).toBe('string');
      });
    });

    it('should have correct labels', () => {
      expect(ROOM_TYPE_LABELS[RoomType.BEDROOM]).toBe('Bedroom');
      expect(ROOM_TYPE_LABELS[RoomType.KITCHEN]).toBe('Kitchen');
      expect(ROOM_TYPE_LABELS[RoomType.BATHROOM]).toBe('Bathroom');
      expect(ROOM_TYPE_LABELS[RoomType.LIVING_ROOM]).toBe('Living Room');
      expect(ROOM_TYPE_LABELS[RoomType.EXTERIOR]).toBe('Exterior');
      expect(ROOM_TYPE_LABELS[RoomType.OTHER]).toBe('Other');
    });
  });

  describe('ROOM_TYPE_COLORS', () => {
    it('should have colors for all room types', () => {
      Object.values(RoomType).forEach(roomType => {
        expect(ROOM_TYPE_COLORS[roomType]).toBeDefined();
        expect(typeof ROOM_TYPE_COLORS[roomType]).toBe('string');
      });
    });

    it('should have valid Tailwind CSS classes', () => {
      Object.values(ROOM_TYPE_COLORS).forEach(colorClass => {
        expect(colorClass).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
      });
    });
  });
});
