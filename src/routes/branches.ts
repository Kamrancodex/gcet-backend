import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import Branch from "../models/Branch";

const router = express.Router();

// Get all branches
router.get("/", async (req: any, res: any) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      // Mock data
      return res.json([
        {
          _id: "1",
          branchId: "BR001",
          name: "Computer Science Engineering",
          shortCode: "CSE",
          department: "Engineering",
          isActive: true,
          totalSemesters: 8,
        },
        {
          _id: "2",
          branchId: "BR002",
          name: "Mechanical Engineering",
          shortCode: "ME",
          department: "Engineering",
          isActive: true,
          totalSemesters: 8,
        },
        {
          _id: "3",
          branchId: "BR003",
          name: "Civil Engineering",
          shortCode: "CE",
          department: "Engineering",
          isActive: true,
          totalSemesters: 8,
        },
        {
          _id: "4",
          branchId: "BR004",
          name: "Electrical Engineering",
          shortCode: "EE",
          department: "Engineering",
          isActive: true,
          totalSemesters: 8,
        },
      ]);
    }

    const { isActive } = req.query;
    const filter: any = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const branches = await Branch.find(filter).sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get branch by ID
router.get("/:id", async (req: any, res: any) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      return res.json({
        _id: req.params.id,
        branchId: "BR001",
        name: "Computer Science Engineering",
        shortCode: "CSE",
        department: "Engineering",
        isActive: true,
        totalSemesters: 8,
        semesterSubjects: {},
      });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    console.error("Get branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create branch
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Branch name is required"),
    body("shortCode").trim().notEmpty().withMessage("Short code is required"),
    body("department").trim().notEmpty().withMessage("Department is required"),
  ],
  async (req: any, res: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const isMongoConnected = mongoose.connection.readyState === 1;

      if (!isMongoConnected) {
        const mockBranch = {
          _id: Date.now().toString(),
          branchId: `BR${Date.now()}`,
          ...req.body,
          isActive: true,
          totalSemesters: 8,
          createdAt: new Date().toISOString(),
        };
        return res.status(201).json(mockBranch);
      }

      const branch = new Branch(req.body);
      await branch.save();
      res.status(201).json(branch);
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ error: "Branch code already exists" });
      }
      console.error("Create branch error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update branch
router.put("/:id", async (req: any, res: any) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      return res.json({
        _id: req.params.id,
        ...req.body,
        updatedAt: new Date().toISOString(),
      });
    }

    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(branch);
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete branch
router.delete("/:id", async (req: any, res: any) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      return res.json({ message: "Branch deleted successfully" });
    }

    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get subjects for a specific semester of a branch
router.get("/:id/semester/:semesterNo/subjects", async (req: any, res: any) => {
  try {
    const { id, semesterNo } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      // Mock subjects for semester 5 CSE
      return res.json([
        {
          subjectCode: "CS501",
          subjectName: "Computer Networks",
          subjectType: "theory",
          credits: 4,
          internalMarks: 50,
          externalMarks: 100,
          totalMarks: 150,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS502",
          subjectName: "Database Management Systems",
          subjectType: "theory",
          credits: 4,
          internalMarks: 50,
          externalMarks: 100,
          totalMarks: 150,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS503",
          subjectName: "Operating Systems",
          subjectType: "theory",
          credits: 4,
          internalMarks: 50,
          externalMarks: 100,
          totalMarks: 150,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS504",
          subjectName: "Software Engineering",
          subjectType: "theory",
          credits: 3,
          internalMarks: 50,
          externalMarks: 100,
          totalMarks: 150,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS505",
          subjectName: "Web Technologies",
          subjectType: "theory",
          credits: 3,
          internalMarks: 50,
          externalMarks: 100,
          totalMarks: 150,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS506",
          subjectName: "Artificial Intelligence",
          subjectType: "theory",
          credits: 3,
          internalMarks: 50,
          externalMarks: 100,
          totalMarks: 150,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS551",
          subjectName: "Computer Networks Lab",
          subjectType: "practical",
          credits: 2,
          practicalMarks: 50,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS552",
          subjectName: "DBMS Lab",
          subjectType: "practical",
          credits: 2,
          practicalMarks: 50,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS553",
          subjectName: "Web Technologies Lab",
          subjectType: "lab",
          credits: 2,
          practicalMarks: 50,
          isMandatory: true,
          isElective: false,
        },
        {
          subjectCode: "CS554",
          subjectName: "Mini Project",
          subjectType: "project",
          credits: 2,
          practicalMarks: 100,
          isMandatory: true,
          isElective: false,
        },
      ]);
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    const subjects = branch.semesterSubjects.get(parseInt(semesterNo)) || [];
    res.json(subjects);
  } catch (error) {
    console.error("Get semester subjects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update subjects for a specific semester
router.put("/:id/semester/:semesterNo/subjects", async (req: any, res: any) => {
  try {
    const { id, semesterNo } = req.params;
    const { subjects } = req.body;

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (!isMongoConnected) {
      return res.json({
        message: "Subjects updated successfully",
        subjects,
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    branch.semesterSubjects.set(parseInt(semesterNo), subjects);
    await branch.save();

    res.json({
      message: "Subjects updated successfully",
      subjects: branch.semesterSubjects.get(parseInt(semesterNo)),
    });
  } catch (error) {
    console.error("Update semester subjects error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;












