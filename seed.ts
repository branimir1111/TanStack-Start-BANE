import mongoose from 'mongoose';
import dbConnect from './src/server/db';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import User, { IUser } from './src/server/models/User';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const NUM_USERS_TO_CREATE = 20;

if (!MONGO_URI) {
  console.error('Greška: Definišite MONGO_URI u .env fajlu.');
  process.exit(1);
}

// --- FUNKCIJA ZA GENERISANJE FAKE KORISNIKA ---
// Definišemo povratni tip funkcije. Koristimo `Partial<IUser>` jer
// ne kreiramo ceo Mongoose dokument, već samo objekat sa podacima.
const createRandomUser = (): Partial<IUser> => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    firstName,
    lastName,
    username: faker.internet.username({ firstName, lastName }),
    email: faker.internet.email({ firstName, lastName }),
    password: 'riminarb',
    role: 'user',
  };
};

const seedDatabase = async () => {
  try {
    console.log('Povezivanje sa MongoDB bazom...');
    await dbConnect();
    console.log('✅ Uspešno povezan sa bazom.');

    console.log('Brisanje postojećih korisnika...');
    await User.deleteMany({});
    console.log('✅ Postojeći korisnici obrisani.');

    console.log(`Generisanje ${NUM_USERS_TO_CREATE} novih korisnika...`);
    const usersToCreate: Partial<IUser>[] = Array.from(
      { length: NUM_USERS_TO_CREATE },
      createRandomUser
    );
    console.log('✅ Korisnici generisani u memoriji.');

    console.log('Ubacivanje korisnika u bazu...');
    await Promise.all(usersToCreate.map((u) => User.create(u)));
    console.log(`🎉 Uspešno uneto ${NUM_USERS_TO_CREATE} korisnika u bazu!`);
  } catch (error) {
    console.error('❌ Došlo je do greške prilikom popunjavanja baze:');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Konekcija sa bazom je zatvorena.');
  }
};

seedDatabase();
