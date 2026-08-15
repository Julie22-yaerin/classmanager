-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "textbook" TEXT,
    "curriculum" TEXT,
    "teacherPersona" TEXT,
    "teachingStyle" TEXT,
    "questionStyle" TEXT,
    "assessmentPatterns" TEXT,
    "topicPriorities" TEXT,
    "importantDates" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "title" TEXT,
    "sourceType" TEXT NOT NULL,
    "rawContent" TEXT,
    "extractedText" TEXT,
    "topic" TEXT,
    "analysis" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT,
    "role" TEXT NOT NULL,
    "tag" TEXT,
    "mode" TEXT,
    "content" TEXT NOT NULL,
    "fileName" TEXT,
    "materialId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" DATETIME,
    "sourceType" TEXT NOT NULL,
    "notes" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deadline_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "topicPriority" TEXT NOT NULL,
    "patternAnalysis" TEXT NOT NULL,
    "markDistribution" TEXT NOT NULL,
    "weakAreas" TEXT NOT NULL,
    "mockExam" TEXT NOT NULL,
    "reviewSheet" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamReport_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "academicLevel" TEXT,
    "explanationStyle" TEXT,
    "communicationStyle" TEXT,
    "learningPreferences" TEXT,
    "weaknesses" TEXT,
    "updatedAt" DATETIME NOT NULL
);
