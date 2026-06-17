import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/company/scholars")({
  component: CompanyScholarsPage,
});

function calculateMatch(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills.length) return 0;

  const student = studentSkills.map((s) => s.toLowerCase());

  let matches = 0;

  requiredSkills.forEach((skill) => {
    if (student.includes(skill.toLowerCase())) {
      matches++;
    }
  });

  return Math.round((matches / requiredSkills.length) * 100);
}

function CompanyScholarsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("");

  const [selectedCourse, setSelectedCourse] = useState("");

  async function loadCompanySkills() {
    const { data } = await supabase

      .from("job_posts")

      .select("required_skills")

      .eq("active", true)

      .limit(1)

      .single();

    if (data) {
      setRequiredSkills(data.required_skills || []);
    }
  }

  async function loadStudents() {
    const { data, error } = await supabase.from("student_profiles").select("*");

    if (error) {
      console.log(error);
      return;
    }

    setStudents(data || []);
  }

  useEffect(() => {
    loadStudents();

    loadCompanySkills();
  }, []);

  const universities = [...new Set(students.map((s) => s.university).filter(Boolean))];

  const courses = [...new Set(students.map((s) => s.course).filter(Boolean))];
  const filtered = students.filter((student) => {
    const value = search.toLowerCase();

    const matchesSearch =
      student.name?.toLowerCase().includes(value) ||
      student.university?.toLowerCase().includes(value) ||
      student.course?.toLowerCase().includes(value) ||
      student.skills?.join(" ").toLowerCase().includes(value);

    const matchesUniversity = !selectedUniversity || student.university === selectedUniversity;

    const matchesCourse = !selectedCourse || student.course === selectedCourse;

    return matchesSearch && matchesUniversity && matchesCourse;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Search Scholars</h1>

      <input
        type="text"
        placeholder="Search by skills, university or course"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded-md p-3"
      />

      <div className="flex gap-4 flex-wrap">
        <select
          value={selectedUniversity}
          onChange={(e) => setSelectedUniversity(e.target.value)}
          className="border rounded-md p-3 bg-background text-foreground"
        >
          <option value="">All Universities</option>

          {universities.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="border rounded-md p-3 bg-background text-foreground"
        >
          <option value="">All Courses</option>

          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((student) => (
          <div key={student.user_id} className="border rounded-lg p-4">
            <h2 className="font-bold text-lg">{student.name}</h2>

            <p>{student.university}</p>

            <p>{student.course}</p>

            <p>{student.year_of_study}</p>

            <p className="text-muted-foreground">📍 {student.location || "Not specified"}</p>

            <p className="text-muted-foreground">
              🎓 Graduation:
              {student.graduation_year || "N/A"}
            </p>

            <div className="flex gap-2 mt-2 flex-wrap">
              {student.skills?.map((skill) => (
                <span
                  key={skill}
                  className="bg-muted text-foreground px-2 py-1 rounded-md text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <p className="font-bold">
                AI Match:
                {calculateMatch(student.skills, requiredSkills)}%
              </p>
            </div>

            <div className="mt-4 flex gap-3 flex-wrap">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md">View Profile</button>

              {student.resume_url && (
                <a
                  href={student.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="
 bg-purple-600
 text-white
 px-4
 py-2
 rounded-md
 "
                >
                  View Resume
                </a>
              )}

              <button className="bg-green-600 text-white px-4 py-2 rounded-md">Message</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
