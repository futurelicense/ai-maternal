import { memoryStore } from '../src/db/memory-store.js';
import { authService } from '../src/services/auth.service.js';

async function seed() {
  console.log('🌱 Seeding in-memory database...');

  try {
    // Create demo user
    await authService.createDefaultUser();

    // Seed policy scenarios
    const policies = [
      {
        scenarioId: 'PS001',
        name: 'Expanded Prenatal Care',
        description: 'Increase prenatal visits from 4 to 8 for all pregnancies',
        maternalMortalityChange: -18,
        infantMortalityChange: -12,
        costIncrease: 15,
        implementationTime: '6 months',
      },
      {
        scenarioId: 'PS002',
        name: 'Telehealth Integration',
        description: 'Provide telehealth options for 50% of routine prenatal checkups',
        maternalMortalityChange: -10,
        infantMortalityChange: -8,
        costIncrease: 8,
        implementationTime: '3 months',
      },
      {
        scenarioId: 'PS003',
        name: 'Community Health Workers',
        description: 'Deploy community health workers in high-risk neighborhoods',
        maternalMortalityChange: -25,
        infantMortalityChange: -20,
        costIncrease: 22,
        implementationTime: '9 months',
      },
    ];

    for (const policy of policies) {
      await memoryStore.createPolicyScenario(policy);
    }

    console.log('✅ Policy scenarios seeded');

    // Seed resource allocations
    const resources = [
      { region: 'North County', nicuBeds: 12, obgynStaff: 8, vaccineStock: 85, lastUpdated: new Date() },
      { region: 'Central District', nicuBeds: 18, obgynStaff: 15, vaccineStock: 65, lastUpdated: new Date() },
      { region: 'South County', nicuBeds: 8, obgynStaff: 6, vaccineStock: 90, lastUpdated: new Date() },
      { region: 'East Region', nicuBeds: 15, obgynStaff: 12, vaccineStock: 75, lastUpdated: new Date() },
      { region: 'West Region', nicuBeds: 10, obgynStaff: 9, vaccineStock: 80, lastUpdated: new Date() },
    ];

    for (const resource of resources) {
      await memoryStore.createOrUpdateResourceAllocation(resource);
    }

    console.log('✅ Resource allocations seeded');

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Demo credentials:');
    console.log('  Email: demo@healthai.com');
    console.log('  Password: password123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
