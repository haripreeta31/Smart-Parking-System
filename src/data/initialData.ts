import { ParkingSlot, VehicleEntryLog, HourlyTrafficData, ParkingSettings } from '../types';

export const INITIAL_SETTINGS: ParkingSettings = {
  carHourlyRate: 4.0,
  busHourlyRate: 10.0,
  bikeHourlyRate: 1.5,
  systemName: 'Metro Central Parking Hub',
  gateMode: 'auto',
  overstayLimitHours: 12,
  enableLiveSimulation: false,
};

const CAR_MODELS = [
  'Tesla Model 3 (Midnight Silver)',
  'Toyota RAV4 (Pearl White)',
  'BMW 330i (Alpine White)',
  'Honda Civic (Lunar Silver)',
  'Ford Mustang Mach-E (Rapid Red)',
  'Hyundai Ioniq 5 (Cyber Gray)',
  'Mercedes-Benz C300 (Obsidian Black)',
  'Audi A4 (Glacier White)',
  'Volkswagen Golf (Deep Black)',
  'Nissan Rogue (Caspian Blue)',
  'Kia EV6 (Steel Gray)',
  'Mazda CX-5 (Soul Red Crystal)',
];

const BUS_MODELS = [
  'Volvo 9700 Luxury Coach',
  'Mercedes-Benz Tourismo',
  'Scania Touring Coach',
  'BYD Electric City Bus',
  'Gillig Low Floor Transit',
  'MCI J4500 Motor Coach',
  'New Flyer Xcelsior',
  'Alexander Dennis Enviro500',
];

const BIKE_MODELS = [
  'Yamaha MT-07 (Raven)',
  'Kawasaki Ninja 400 (Lime Green)',
  'Honda Rebel 500 (Matte Black)',
  'Ducati Monster (Ducati Red)',
  'BMW R1250GS (Triple Black)',
  'Triumph Bonneville T120',
  'Royal Enfield Hunter 350',
  'Suzuki V-Strom 650',
  'KTM 390 Duke (Orange/White)',
  'Vespa Primavera 150 (Grigio Delicato)',
];

const DRIVERS = [
  { name: 'Alex Martinez', phone: '+1 (555) 234-8901' },
  { name: 'Sarah Jenkins', phone: '+1 (555) 876-1234' },
  { name: 'David Chen', phone: '+1 (555) 432-9876' },
  { name: 'Elena Rostova', phone: '+1 (555) 321-6547' },
  { name: 'Michael Rodriguez', phone: '+1 (555) 654-7890' },
  { name: 'Priya Sharma', phone: '+1 (555) 789-0123' },
  { name: 'James Wilson', phone: '+1 (555) 890-2345' },
  { name: 'Liam O\'Connor', phone: '+1 (555) 901-3456' },
  { name: 'Emily Zhang', phone: '+1 (555) 012-4567' },
  { name: 'Marcus Taylor', phone: '+1 (555) 123-5678' },
  { name: 'Chloe Dubois', phone: '+1 (555) 345-6789' },
  { name: 'Kiran Patel', phone: '+1 (555) 567-8901' },
];

function generateRandomPlate(type: 'car' | 'bus' | 'bike', index: number): string {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const prefix = type === 'car' ? 'CA' : type === 'bus' ? 'BU' : 'BK';
  const l1 = letters[(index * 7 + 3) % letters.length];
  const l2 = letters[(index * 13 + 5) % letters.length];
  const num = 1000 + ((index * 37 + 123) % 8999);
  return `${prefix}-${num}-${l1}${l2}`;
}

export function generateInitialSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const now = new Date();

  // 1. CARS: 120 slots (Spread across G, F1, F2)
  // 84 occupied, 36 available
  let carOccupiedCount = 0;
  const targetCarOccupied = 84;

  const carFloors: Array<{ floor: 'G' | 'F1' | 'F2'; name: string; count: number; prefix: string }> = [
    { floor: 'G', name: 'Ground Floor', count: 40, prefix: 'C-G' },
    { floor: 'F1', name: 'Level 1 (North)', count: 40, prefix: 'C-1' },
    { floor: 'F2', name: 'Level 2 (South)', count: 40, prefix: 'C-2' },
  ];

  let carIdx = 0;
  carFloors.forEach((fl) => {
    for (let i = 1; i <= fl.count; i++) {
      carIdx++;
      // Determine if occupied to hit exactly 84
      const isOccupied = carOccupiedCount < targetCarOccupied && (carIdx % 10 !== 2 && carIdx % 10 !== 7 && carIdx % 10 !== 9);
      if (isOccupied) carOccupiedCount++;

      const isEv = i <= 6; // first 6 slots on floor are EV charging
      const isHandicapped = i === 7 || i === 8;

      const slotId = `${fl.prefix}${i < 10 ? '0' + i : i}`;
      const entryHoursAgo = (carIdx * 1.3) % 7 + 0.4;
      const entryTime = new Date(now.getTime() - entryHoursAgo * 60 * 60 * 1000).toISOString();
      const driver = DRIVERS[carIdx % DRIVERS.length];
      const model = CAR_MODELS[carIdx % CAR_MODELS.length];

      slots.push({
        id: slotId,
        slotNumber: slotId,
        vehicleType: 'car',
        floor: fl.floor,
        floorName: fl.name,
        status: isOccupied ? 'occupied' : 'available',
        isEvCharging: isEv,
        isHandicapped: isHandicapped,
        currentVehicle: isOccupied
          ? {
              licensePlate: generateRandomPlate('car', carIdx),
              model,
              driverName: driver.name,
              driverPhone: driver.phone,
              entryTime,
              ticketNumber: `TK-C-${1000 + carIdx}`,
              ratePerHour: INITIAL_SETTINGS.carHourlyRate,
            }
          : undefined,
      });
    }
  });

  // 2. BUSES: 20 slots (Ground Floor Heavy Vehicle Bay)
  // 13 occupied, 7 available
  let busOccupiedCount = 0;
  const targetBusOccupied = 13;
  for (let i = 1; i <= 20; i++) {
    const isOccupied = busOccupiedCount < targetBusOccupied && (i % 3 !== 0);
    if (isOccupied) busOccupiedCount++;

    const slotId = `B-${i < 10 ? '0' + i : i}`;
    const entryHoursAgo = (i * 2.1) % 8 + 0.8;
    const entryTime = new Date(now.getTime() - entryHoursAgo * 60 * 60 * 1000).toISOString();
    const driver = DRIVERS[(i + 4) % DRIVERS.length];
    const model = BUS_MODELS[i % BUS_MODELS.length];

    slots.push({
      id: slotId,
      slotNumber: slotId,
      vehicleType: 'bus',
      floor: 'G',
      floorName: 'Ground Heavy Bay',
      status: isOccupied ? 'occupied' : 'available',
      isEvCharging: i <= 4,
      currentVehicle: isOccupied
        ? {
            licensePlate: generateRandomPlate('bus', i),
            model,
            driverName: driver.name,
            driverPhone: driver.phone,
            entryTime,
            ticketNumber: `TK-B-${2000 + i}`,
            ratePerHour: INITIAL_SETTINGS.busHourlyRate,
          }
        : undefined,
    });
  }

  // 3. BIKES: 60 slots (Level 3 Rooftop & G Two-Wheeler Bay)
  // 42 occupied, 18 available
  let bikeOccupiedCount = 0;
  const targetBikeOccupied = 42;
  const bikeFloors: Array<{ floor: 'G' | 'F3'; name: string; count: number; prefix: string }> = [
    { floor: 'G', name: 'Ground Bike Enclosure', count: 30, prefix: 'BK-G' },
    { floor: 'F3', name: 'Level 3 Two-Wheeler Deck', count: 30, prefix: 'BK-3' },
  ];

  let bikeIdx = 0;
  bikeFloors.forEach((fl) => {
    for (let i = 1; i <= fl.count; i++) {
      bikeIdx++;
      const isOccupied = bikeOccupiedCount < targetBikeOccupied && (bikeIdx % 10 !== 3 && bikeIdx % 10 !== 8);
      if (isOccupied) bikeOccupiedCount++;

      const slotId = `${fl.prefix}${i < 10 ? '0' + i : i}`;
      const entryHoursAgo = (bikeIdx * 0.9) % 6 + 0.3;
      const entryTime = new Date(now.getTime() - entryHoursAgo * 60 * 60 * 1000).toISOString();
      const driver = DRIVERS[(bikeIdx + 7) % DRIVERS.length];
      const model = BIKE_MODELS[bikeIdx % BIKE_MODELS.length];

      slots.push({
        id: slotId,
        slotNumber: slotId,
        vehicleType: 'bike',
        floor: fl.floor,
        floorName: fl.name,
        status: isOccupied ? 'occupied' : 'available',
        isEvCharging: i <= 5,
        currentVehicle: isOccupied
          ? {
              licensePlate: generateRandomPlate('bike', bikeIdx),
              model,
              driverName: driver.name,
              driverPhone: driver.phone,
              entryTime,
              ticketNumber: `TK-K-${3000 + bikeIdx}`,
              ratePerHour: INITIAL_SETTINGS.bikeHourlyRate,
            }
          : undefined,
      });
    }
  });

  return slots;
}

export function generateInitialLogs(): VehicleEntryLog[] {
  const logs: VehicleEntryLog[] = [];
  const now = new Date();

  // Completed logs for today
  const samplePast = [
    { type: 'car' as const, plate: 'CA-9421-XK', slot: 'C-G04', floor: 'G' as const, hoursAgo: 5.5, dur: 140, fee: 9.33 },
    { type: 'car' as const, plate: 'CA-3382-PL', slot: 'C-112', floor: 'F1' as const, hoursAgo: 4.8, dur: 195, fee: 13.00 },
    { type: 'bus' as const, plate: 'BU-1849-TR', slot: 'B-03', floor: 'G' as const, hoursAgo: 6.2, dur: 280, fee: 46.67 },
    { type: 'bike' as const, plate: 'BK-5521-LM', slot: 'BK-G02', floor: 'G' as const, hoursAgo: 3.5, dur: 90, fee: 2.25 },
    { type: 'car' as const, plate: 'CA-7719-QW', slot: 'C-219', floor: 'F2' as const, hoursAgo: 7.0, dur: 320, fee: 21.33 },
    { type: 'bike' as const, plate: 'BK-8902-OP', slot: 'BK-311', floor: 'F3' as const, hoursAgo: 2.8, dur: 75, fee: 1.88 },
    { type: 'bus' as const, plate: 'BU-4091-MN', slot: 'B-14', floor: 'G' as const, hoursAgo: 8.1, dur: 360, fee: 60.00 },
    { type: 'car' as const, plate: 'CA-6110-ZT', slot: 'C-105', floor: 'F1' as const, hoursAgo: 1.5, dur: 45, fee: 3.00 },
  ];

  samplePast.forEach((item, idx) => {
    const entryDate = new Date(now.getTime() - item.hoursAgo * 60 * 60 * 1000);
    const exitDate = new Date(entryDate.getTime() + item.dur * 60 * 1000);

    logs.push({
      id: `LOG-HIST-${100 + idx}`,
      ticketNumber: `TK-${item.type.toUpperCase().slice(0, 1)}-${8000 + idx}`,
      licensePlate: item.plate,
      vehicleType: item.type,
      slotId: item.slot,
      floor: item.floor,
      entryTime: entryDate.toISOString(),
      exitTime: exitDate.toISOString(),
      durationMinutes: item.dur,
      feeAmount: item.fee,
      paymentStatus: 'paid',
      status: 'completed',
    });
  });

  return logs;
}

export const HOURLY_TRAFFIC_DATA: HourlyTrafficData[] = [
  { time: '06:00', cars: 22, buses: 4, bikes: 10, total: 36 },
  { time: '08:00', cars: 58, buses: 9, bikes: 28, total: 95 },
  { time: '10:00', cars: 79, buses: 12, bikes: 38, total: 129 },
  { time: '12:00', cars: 88, buses: 14, bikes: 45, total: 147 },
  { time: '14:00', cars: 84, buses: 13, bikes: 42, total: 139 }, // Current peak
  { time: '16:00', cars: 82, buses: 11, bikes: 39, total: 132 },
  { time: '18:00', cars: 65, buses: 8, bikes: 31, total: 104 },
  { time: '20:00', cars: 42, buses: 5, bikes: 20, total: 67 },
  { time: '22:00', cars: 25, buses: 3, bikes: 12, total: 40 },
];
