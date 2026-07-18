const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEMO_SCHOOL_SLUG = 'demo';

const FACULTIES = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Medicine',
  'Law',
  'Arts & Humanities',
  'Natural Sciences',
  'Economics',
];

const SPECIALITIES = {
  'Computer Science': ['Software Engineering', 'Cybersecurity', 'Data Science', 'AI & Machine Learning'],
  'Engineering': ['Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering'],
  'Business Administration': ['Management', 'Marketing', 'International Business'],
  'Medicine': ['General Medicine', 'Pediatrics', 'Pharmacy'],
  'Law': ['Criminal Law', 'International Law', 'Corporate Law'],
  'Arts & Humanities': ['History', 'Philosophy', 'Modern Languages'],
  'Natural Sciences': ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  'Economics': ['Microeconomics', 'Macroeconomics', 'Financial Economics'],
};

const FIRST_NAMES = [
  'John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'James', 'Jessica',
  'Robert', 'Lisa', 'William', 'Anna', 'Daniel', 'Maria', 'Thomas', 'Sophia',
  'Christopher', 'Olivia', 'Andrew', 'Emma', 'Matthew', 'Isabella', 'Ryan', 'Mia',
  'Tyler', 'Charlotte', 'Brandon', 'Amelia', 'Nathan', 'Harper', 'Justin', 'Evelyn',
  'Kevin', 'Abigail', 'Eric', 'Zoe', 'Patrick', 'Nora', 'Stephen', 'Scarlett',
  'Alexander', 'Grace', 'Benjamin', 'Chloe', 'Samuel', 'Penelope', 'Nicholas', 'Layla',
  'Dmitri', 'Yelena', 'Oleg', 'Tatiana', 'Sergei', 'Anastasia', 'Igor', 'Svetlana',
  'Pavel', 'Marina', 'Andrei', 'Vera', 'Mikhail', 'Polina', 'Roman', 'Daria',
  'Viktor', 'Ekaterina', 'Maxim', 'Alina', 'Artem', 'Valeriya', 'Kirill', 'Nadezhda',
  'Bogdan', 'Oksana', 'Taras', 'Iryna', 'Dmytro', 'Olena', 'Andriy', 'Nataliya',
  'Serhiy', 'Tetiana', 'Petro', 'Halyna', 'Yurii', 'Liudmyla', 'Oleksandr', 'Iryna',
  'Mykola', 'Oksana', 'Vasyl', 'Kateryna',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen',
  'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera',
  'Kovalenko', 'Shevchenko', 'Tkachenko', 'Bondarenko', 'Boiko', 'Melnyk',
  'Savchenko', 'Hrytsenko', 'Polishchuk', 'Kovalchuk', 'Marchenko', 'Rudenko',
  'Mazur', 'Bondar', 'Shevchuk', 'Kravchenko', 'Oliynyk', 'Husak', 'Pavlenko',
  'Lysenko', 'Tymoshenko', 'Hryhorenko', 'Ponomarenko', 'Vasylenko', 'Moroz',
  'Ivanov', 'Petrov', 'Sidorov', 'Kuznetsov', 'Volkov', 'Smirnov', 'Popov',
  'Mikhailov', 'Fedorov', 'Vasiliev', 'Romanov', 'Zaitsev', 'Pavlov',
  'Sokolov', 'Lebedev', 'Morozov', 'Novikov', 'Frolov', 'Zakharov',
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner',
  'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter',
];

const COURSE_NAMES = [
  'Calculus I', 'Linear Algebra', 'Data Structures', 'Algorithms',
  'Operating Systems', 'Databases', 'Web Development', 'Machine Learning',
  'Computer Networks', 'Software Engineering', 'Statistics', 'Discrete Math',
  'Artificial Intelligence', 'Cybersecurity Fundamentals', 'Cloud Computing',
];

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

function generatePhone(rng) {
  const d = () => Math.floor(rng() * 10);
  return `+38 (0${d()}${d()}) ${d()}${d()}${d()}-${d()}${d()}-${d()}${d()}`;
}

function generateDateOfBirth(rng) {
  const year = 2000 + Math.floor(rng() * 8);
  const month = String(1 + Math.floor(rng() * 12)).padStart(2, '0');
  const day = String(1 + Math.floor(rng() * 28)).padStart(2, '0');
  return `${day}.${month}.${year}`;
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Refusing destructive seed in production. Set ALLOW_DESTRUCTIVE_SEED=true only for an intentional demo reset.');
  }

  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  // Create test users with known credentials
  const passwordHash = await bcrypt.hash('test12345', 10);

  // Demo school
  const school = await prisma.school.create({
    data: {
      name: 'Demo School',
      slug: DEMO_SCHOOL_SLUG,
    },
  });
  console.log('Created demo school:', school.slug);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@university.edu',
      passwordHash,
      fullName: 'Admin User',
      role: 'ADMIN',
      schoolId: school.id,
      photo: '',
      phone: '+38 (044) 123-45-67',
      address: 'Kyiv, Ukraine',
      birthDate: '15.05.1985',
    },
  });
  console.log('Created admin user:', admin.username);

  // Teacher user
  const teacher = await prisma.user.create({
    data: {
      username: 'teacher',
      email: 'teacher@university.edu',
      passwordHash,
      fullName: 'Professor John Smith',
      role: 'TEACHER',
      schoolId: school.id,
      faculty: 'Computer Science',
      speciality: 'Software Engineering',
      photo: '',
      phone: '+38 (044) 234-56-78',
      address: 'Kyiv, Ukraine',
      birthDate: '20.03.1975',
    },
  });
  console.log('Created teacher user:', teacher.username);

  // Demo student
  const student = await prisma.user.create({
    data: {
      username: 'student',
      email: 'student@university.edu',
      passwordHash,
      fullName: 'Demo Student',
      role: 'STUDENT',
      faculty: 'Computer Science',
      speciality: 'Software Engineering',
      groupName: 'Group 101',
      studyForm: 'FullTime',
      status: 'Studying',
      studyYear: 3,
      gpa: 4.25,
      phone: '+38 (050) 345-67-89',
      address: 'Kyiv, Ukraine',
      birthDate: '10.08.2003',
      gradeBookNumber: 'GB-00001',
      codeOfHonorSigned: true,
      schoolId: school.id,
      courses: {
        create: [
          { name: 'Calculus I', grade: 85, credits: 5, teacherId: teacher.id, schoolId: school.id },
          { name: 'Data Structures', grade: 92, credits: 4, teacherId: teacher.id, schoolId: school.id },
          { name: 'Operating Systems', grade: 78, credits: 6, teacherId: teacher.id, schoolId: school.id },
          { name: 'Web Development', grade: 95, credits: 4, teacherId: teacher.id, schoolId: school.id },
          { name: 'Machine Learning', grade: 88, credits: 5, teacherId: teacher.id, schoolId: school.id },
        ],
      },
      attendance: {
        create: [
          { month: 'Sep', present: 28, total: 30 },
          { month: 'Oct', present: 25, total: 28 },
          { month: 'Nov', present: 26, total: 30 },
          { month: 'Dec', present: 22, total: 25 },
          { month: 'Jan', present: 18, total: 20 },
          { month: 'Feb', present: 24, total: 28 },
          { month: 'Mar', present: 27, total: 30 },
          { month: 'Apr', present: 29, total: 30 },
          { month: 'May', present: 26, total: 29 },
        ],
      },
    },
  });
  console.log('Created demo student:', student.username);

  // Generate 120 random users
  const rng = seededRandom(42);
  for (let i = 1; i <= 120; i++) {
    const firstName = pick(FIRST_NAMES, rng);
    const lastName = pick(LAST_NAMES, rng);
    const faculty = pick(FACULTIES, rng);
    const specialities = SPECIALITIES[faculty] || ['General Studies'];
    const speciality = pick(specialities, rng);
    const groupNum = 100 + Math.floor(rng() * 400);
    const isStudent = rng() > 0.1;
    const role = isStudent ? 'STUDENT' : 'TEACHER';
    const studyForm = isStudent ? pick(['FullTime', 'Remote', 'Evening', 'Correspondence'], rng) : null;
    const status = isStudent
      ? pick(['Studying', 'Studying', 'Studying', 'OnAcademicLeave', 'Dismissed'], rng)
      : 'Studying';
    const gpa = isStudent ? Math.round((2 + rng() * 3) * 100) / 100 : 0;
    const courseCount = isStudent ? 5 + Math.floor(rng() * 4) : 0;
    const shuffledCourses = [...COURSE_NAMES].sort(() => rng() - 0.5);
    const courses = Array.from({ length: courseCount }, (_, j) => ({
      name: shuffledCourses[j],
      grade: Math.round((60 + rng() * 40) * 10) / 10,
      credits: pick([3, 4, 5, 6], rng),
      teacherId: teacher.id,
      schoolId: school.id,
    }));
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const attendance = months.map((m) => {
      const total = 20 + Math.floor(rng() * 10);
      const present = Math.floor(rng() * (total + 1));
      return { month: m, present, total };
    });

    await prisma.user.create({
      data: {
        username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@university.edu`,
        passwordHash: await bcrypt.hash('password123', 10),
        fullName: `${firstName} ${lastName}`,
        role,
        faculty,
        speciality: isStudent ? speciality : null,
        groupName: isStudent ? `Group ${groupNum}` : null,
        studyForm,
        status,
        studyYear: isStudent ? 1 + Math.floor(rng() * 4) : 0,
        gpa,
        phone: generatePhone(rng),
        address: `${pick(['Kyiv', 'Lviv', 'Odesa', 'Kharkiv', 'Dnipro'], rng)}, Ukraine`,
        birthDate: generateDateOfBirth(rng),
        gradeBookNumber: isStudent ? `GB-${String(i + 1).padStart(5, '0')}` : null,
        codeOfHonorSigned: rng() > 0.2,
        schoolId: school.id,
        ...(isStudent ? { courses: { create: courses } } : {}),
        ...(isStudent ? { attendance: { create: attendance } } : {}),
      },
    });
  }
  console.log('Created 120 random users');

  // Create some notifications for the demo student
  await prisma.notification.createMany({
    data: [
      { title: 'New grade posted', message: 'Your Machine Learning grade has been updated: 88/100', type: 'grade', userId: student.id },
      { title: 'Schedule change', message: 'Web Development class moved to Room 302', type: 'schedule', userId: student.id },
      { title: 'New announcement', message: 'Midterm exams start next week. Check the schedule.', type: 'announcement', userId: student.id },
      { title: 'Honor code reminder', message: 'Please sign the code of honor if you haven\'t already.', type: 'info', userId: student.id },
    ],
  });
  console.log('Created notifications for demo student');

  console.log('Seed complete!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Admin:    admin / test12345');
  console.log('  Teacher:  teacher / test12345');
  console.log('  Student:  student / test12345');
  console.log('  School:   ' + DEMO_SCHOOL_SLUG);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
