import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Facilities (fields, courts, gyms)
export const facilities = sqliteTable('facilities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address'),
  capacity: integer('capacity'),
  surfaceType: text('surface_type'), // grass, turf, hardwood, etc.
  hasLighting: integer('has_lighting', { mode: 'boolean' }).default(false),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Facility availability rules
export const availabilityRules = sqliteTable('availability_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facilityId: integer('facility_id').references(() => facilities.id).notNull(),
  dayOfWeek: text('day_of_week').notNull(), // monday, tuesday, etc.
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// Teams
export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ageGroup: text('age_group'), // U8, U10, U12, etc.
  division: text('division'),
  sport: text('sport'), // soccer, basketball, baseball, etc.
  coachName: text('coach_name'),
  coachEmail: text('coach_email'),
  coachPhone: text('coach_phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Players
export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  parentName: text('parent_name'),
  parentEmail: text('parent_email'),
  parentPhone: text('parent_phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Coaches (separate from team coach - for multi-coach teams)
export const coaches = sqliteTable('coaches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').references(() => teams.id).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Scheduled events (games/practices)
export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  facilityId: integer('facility_id').references(() => facilities.id).notNull(),
  homeTeamId: integer('home_team_id').references(() => teams.id),
  awayTeamId: integer('away_team_id').references(() => teams.id),
  eventType: text('event_type').notNull(), // practice, game
  title: text('title'),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  isPublished: integer('is_published', { mode: 'boolean' }).default(false),
  hasConflict: integer('has_conflict', { mode: 'boolean' }).default(false),
  conflictReason: text('conflict_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Global preferences
export const preferences = sqliteTable('preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});

// Type exports
export type Facility = typeof facilities.$inferSelect;
export type NewFacility = typeof facilities.$inferInsert;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Coach = typeof coaches.$inferSelect;
export type NewCoach = typeof coaches.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type Preference = typeof preferences.$inferSelect;
export type NewPreference = typeof preferences.$inferInsert;
