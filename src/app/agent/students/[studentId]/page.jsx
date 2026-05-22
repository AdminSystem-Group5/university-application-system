// agent student detail and application creation
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";
import {
  getActiveLinksForAgent,
  createApplicationForStudent,
  getAllUniversities,
  ensureAgentLookupDocuments,
} from "@/lib/firebase-utils";
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const STATUS_COLOURS = {
  Draft: "#ccc",
  Submitted: "#3B2E5A",
  "Under Review": "#ffd500",
  Offered: "#48A111",
  Rejected: "#EF5350",
  Withdrawn: "#888",
};

export default function AgentStudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const studentId = params?.studentId;

  const [agent, setAgent] = useState(null);
  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notLinked, setNotLinked] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    nationality: "",
    passportNumber: "",
    highestQualification: "",
    institutionName: "",
    graduationYear: "",
    gpaGrade: "",
    selectedUniversityId: "",
    selectedUniversity: "",
    selectedCourseId: "",
    courseName: "",
    intendedIntake: "",
    personalStatement: "",
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.replace("/login"); return; }

      try {
        const agentSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!agentSnap.exists() || agentSnap.data().role !== "agent") {
          router.replace("/login");
          return;
        }
        const agentData = { uid: firebaseUser.uid, ...agentSnap.data() };
        setAgent(agentData);

        const activeLinks = await getActiveLinksForAgent(firebaseUser.uid);
        const link = activeLinks.find((l) => l.studentId === studentId);

        if (!link) {
          setNotLinked(true);
          setLoading(false);
          return;
        }

        const studentSnap = await getDoc(doc(db, "users", studentId));
        if (studentSnap.exists()) {
          setStudent(studentSnap.data());
        }

        // Make sure lookup docs exist before querying apps — rules use exists(agentId_studentId).
        await ensureAgentLookupDocuments(firebaseUser.uid).catch(() => {});

        const appsQuery = query(
          collection(db, "applications"),
          where("studentId", "==", studentId)
        );
        const appsSnapshot = await getDocs(appsQuery);
        const apps = appsSnapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const at = a.createdAt?.toDate?.()?.getTime() ?? 0;
            const bt = b.createdAt?.toDate?.()?.getTime() ?? 0;
            return bt - at;
          });
        setApplications(apps);

        const unis = await getAllUniversities();
        setUniversities(unis);
      } catch (err) {
        console.error("Student detail error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, studentId]);

  const handleUniversityChange = (e) => {
    const universityId = e.target.value;
    const uni = universities.find((u) => u.id === universityId);
    setFormData((prev) => ({
      ...prev,
      selectedUniversityId: universityId,
      selectedUniversity: uni?.name || "",
      selectedCourseId: "",
      courseName: "",
    }));
    setCourses(uni?.courses || []);
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find((c) => c.courseId === courseId);
    setFormData((prev) => ({
      ...prev,
      selectedCourseId: courseId,
      courseName: course?.courseName || "",
    }));
  };

  const handleField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!formData.selectedUniversityId || !formData.selectedCourseId || !formData.intendedIntake) {
      setFormError("Please select a university, course, and intended intake date.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      await createApplicationForStudent(
        agent.uid,
        agent.displayName,
        agent.agencyName,
        studentId,
        {
          universityId: formData.selectedUniversityId,
          universityName: formData.selectedUniversity,
          university: formData.selectedUniversity,
          courseInfo: {
            courseId: formData.selectedCourseId,
            courseName: formData.courseName,
            intendedStartDate: formData.intendedIntake,
          },
          courseName: formData.courseName,
          intendedIntake: formData.intendedIntake,
          personalInfo: {
            firstName: formData.fullName.split(" ")[0] || "",
            lastName: formData.fullName.split(" ").slice(1).join(" ") || "",
            dateOfBirth: formData.dateOfBirth,
            nationality: formData.nationality,
            passportNumber: formData.passportNumber,
          },
          fullName: formData.fullName,
          academicInfo: {
            highestQualification: formData.highestQualification,
            institutionName: formData.institutionName,
            graduationYear: formData.graduationYear,
            gpaGrade: formData.gpaGrade,
          },
          personalStatement: formData.personalStatement,
        }
      );

      setSuccessMessage(t("agent.studentDetail.applicationCreated"));
      setShowForm(false);

      const db = getFirestoreDb();
      const appsQuery = query(collection(db, "applications"), where("studentId", "==", studentId));
      const appsSnapshot = await getDocs(appsQuery);
      const apps = appsSnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const at = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const bt = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return bt - at;
        });
      setApplications(apps);
    } catch (err) {
      console.error("Create application error:", err);
      setFormError("Failed to create application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    router.replace("/");
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <p style={loadingStyle}>{t("agent.studentDetail.loading")}</p>
        </div>
      </main>
    );
  }

  if (notLinked) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <header style={headerStyle}>
            <h1 style={logoStyle}>UAAMS</h1>
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent/students")}>← BACK</button>
          </header>
          <div style={{ textAlign: "center", padding: "80px", background: "#fff", border: "2px solid #000", maxWidth: "600px", margin: "0 auto" }}>
            <p style={{ fontSize: "20px", fontWeight: "900", marginBottom: "20px" }}>{t("agent.studentDetail.accessDenied")}</p>
            <p style={{ color: "#666" }}>{t("agent.studentDetail.notLinked")}</p>
            <button type="button" style={{ ...navBtnStyle, marginTop: "20px" }} onClick={() => router.push("/agent/students")}>
              {t("agent.studentDetail.backToStudents")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={frameStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={logoStyle}>UAAMS</h1>
            <p style={subtitleStyle}>University Administration & Application Management System</p>
          </div>
          <nav style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <LanguageSwitcher />
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent")}>{t("nav.dashboard")}</button>
            <button type="button" style={navBtnStyle} onClick={() => router.push("/agent/students")}>{t("agent.dashboard.myStudents")}</button>
            <button type="button" style={{ ...navBtnStyle, borderColor: "#3B2E5A", color: "#3B2E5A" }} onClick={handleLogout}>{t("nav.logout")}</button>
          </nav>
        </header>

        <section style={sectionBoxStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: "26px", fontWeight: "900" }}>
                {student?.displayName || student?.fullName || studentId}
              </h2>
              <p style={{ margin: 0, color: "#555" }}>
                {student?.email} &nbsp;|&nbsp; Nationality: {student?.nationality || "—"} &nbsp;|&nbsp; Level: {student?.levelOfStudy || "—"}
              </p>
            </div>

            <button
              type="button"
              style={primaryBtnStyle}
              onClick={() => { setShowForm(!showForm); setFormError(""); setSuccessMessage(""); }}
            >
              {showForm ? t("agent.studentDetail.cancel") : t("agent.studentDetail.createApplication")}
            </button>
          </div>
        </section>

        {successMessage && (
          <div style={{ maxWidth: "1600px", margin: "16px auto 0", padding: "16px 24px", background: "#e6f4ea", border: "2px solid #48A111", fontWeight: "800", color: "#1e5c0f" }}>
            {successMessage}
          </div>
        )}

        {showForm && (
          <section style={{ ...sectionBoxStyle, marginTop: "24px" }}>
            <h3 style={{ margin: "0 0 24px", fontSize: "20px", fontWeight: "900" }}>
              {t("agent.studentDetail.createFor")} {(student?.displayName || "STUDENT").toUpperCase()}
            </h3>

            {formError && (
              <p style={{ color: "red", fontWeight: "800", marginBottom: "16px" }}>{formError}</p>
            )}

            <form onSubmit={handleSubmitApplication}>
              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.studentFullName")}</label>
                  <input type="text" value={formData.fullName} onChange={handleField("fullName")} style={inputStyle} required disabled={submitting} placeholder="Full name" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.dateOfBirth")}</label>
                  <input type="date" value={formData.dateOfBirth} onChange={handleField("dateOfBirth")} style={inputStyle} disabled={submitting} />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.nationality")}</label>
                  <input type="text" value={formData.nationality} onChange={handleField("nationality")} style={inputStyle} disabled={submitting} placeholder="Nationality" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.passportNumber")}</label>
                  <input type="text" value={formData.passportNumber} onChange={handleField("passportNumber")} style={inputStyle} disabled={submitting} placeholder="Passport number" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.highestQualification")}</label>
                  <select value={formData.highestQualification} onChange={handleField("highestQualification")} style={inputStyle} disabled={submitting}>
                    <option value="">Select qualification</option>
                    <option>A-Levels</option>
                    <option>Bachelor&apos;s Degree</option>
                    <option>Master&apos;s Degree</option>
                    <option>PhD</option>
                    <option>Foundation Diploma</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.institutionName")}</label>
                  <input type="text" value={formData.institutionName} onChange={handleField("institutionName")} style={inputStyle} disabled={submitting} placeholder="Previous institution" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.graduationYear")}</label>
                  <input type="text" value={formData.graduationYear} onChange={handleField("graduationYear")} style={inputStyle} disabled={submitting} placeholder="e.g. 2023" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.gpaGrade")}</label>
                  <input type="text" value={formData.gpaGrade} onChange={handleField("gpaGrade")} style={inputStyle} disabled={submitting} placeholder="e.g. 3.8 / First Class" />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.selectUniversity")}</label>
                  <select value={formData.selectedUniversityId} onChange={handleUniversityChange} style={inputStyle} required disabled={submitting}>
                    <option value="">Choose university...</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.selectCourse")}</label>
                  <select value={formData.selectedCourseId} onChange={handleCourseChange} style={inputStyle} required disabled={submitting || !formData.selectedUniversityId}>
                    <option value="">Choose course...</option>
                    {courses.map((c) => (
                      <option key={c.courseId} value={c.courseId}>{c.courseName} ({c.level})</option>
                    ))}
                  </select>
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>{t("agent.studentDetail.intendedIntake")}</label>
                  <input type="month" value={formData.intendedIntake} onChange={handleField("intendedIntake")} style={inputStyle} required disabled={submitting} />
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <label style={labelStyle}>{t("agent.studentDetail.personalStatement")}</label>
                <textarea
                  value={formData.personalStatement}
                  onChange={handleField("personalStatement")}
                  style={{ ...inputStyle, height: "140px", padding: "12px 16px", resize: "vertical" }}
                  disabled={submitting}
                  placeholder="Student's personal statement..."
                />
              </div>

              <div style={{ marginTop: "24px", display: "flex", gap: "16px" }}>
                <button type="submit" disabled={submitting} style={primaryBtnStyle}>
                  {submitting ? t("agent.studentDetail.creating") : t("agent.studentDetail.createAsDraft")}
                </button>
                <button type="button" style={cancelBtnStyle} onClick={() => setShowForm(false)} disabled={submitting}>
                  {t("agent.studentDetail.cancelBtn")}
                </button>
              </div>
            </form>
          </section>
        )}

        <section style={{ ...sectionBoxStyle, marginTop: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "20px", fontWeight: "900" }}>
            {t("agent.studentDetail.applications")} ({applications.length})
          </h3>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>{t("agent.studentDetail.colAppId")}</th>
                <th style={thStyle}>{t("agent.studentDetail.colUniversity")}</th>
                <th style={thStyle}>{t("agent.studentDetail.colCourse")}</th>
                <th style={thStyle}>{t("agent.studentDetail.colIntake")}</th>
                <th style={thStyle}>{t("agent.studentDetail.colStatus")}</th>
                <th style={thStyle}>{t("agent.studentDetail.colViaAgent")}</th>
                <th style={thStyle}>{t("agent.studentDetail.colDate")}</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={emptyRowStyle}>{t("agent.studentDetail.noApplications")}</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td style={tdStyle}>{app.id?.slice(0, 10)}...</td>
                    <td style={tdStyle}>{app.university || app.universityName || app.selectedUniversity || "—"}</td>
                    <td style={tdStyle}>{app.courseName || app.courseInfo?.courseName || "—"}</td>
                    <td style={tdStyle}>{app.intendedIntake || app.courseInfo?.intendedStartDate || "—"}</td>
                    <td style={tdStyle}>
                      <span style={statusBadge(app.status)}>{app.status || "Draft"}</span>
                    </td>
                    <td style={tdStyle}>
                      {app.submittedByAgent ? (
                        <span style={{ background: "#EDE7FF", color: "#3B2E5A", padding: "2px 8px", fontSize: "11px", fontWeight: "800" }}>YES</span>
                      ) : "—"}
                    </td>
                    <td style={tdStyle}>{formatDate(app.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB");
  } catch { return "—"; }
}

function statusBadge(status) {
  const bg = STATUS_COLOURS[status] || "#ccc";
  const light = ["Draft", "Withdrawn"].includes(status);
  return { display: "inline-block", padding: "3px 8px", fontSize: "11px", fontWeight: "900", background: bg, color: light ? "#333" : "#fff", border: "1px solid #000" };
}

const pageStyle = { minHeight: "100vh", background: "#F7F1E8", fontFamily: "Arial, Helvetica, sans-serif", color: "#071126" };
const frameStyle = { width: "100%", padding: "0 40px 60px", boxSizing: "border-box" };
const headerStyle = { height: "95px", width: "100vw", position: "relative", left: "50%", transform: "translateX(-50%)", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 45px", margin: "0 0 28px", borderBottom: "2px solid #000" };
const logoStyle = { margin: 0, fontSize: "48px", fontWeight: "900", lineHeight: "50px" };
const subtitleStyle = { margin: "8px 0 0", fontSize: "16px" };
const navBtnStyle = { background: "#fff", border: "2px solid #000", color: "#071126", height: "50px", padding: "0 20px", fontSize: "13px", fontWeight: "800", cursor: "pointer" };
const sectionBoxStyle = { width: "100%", maxWidth: "1600px", margin: "0 auto", background: "#fff", border: "2px solid #000", padding: "30px", boxSizing: "border-box" };
const primaryBtnStyle = { background: "#3B2E5A", color: "#fff", border: "none", height: "52px", padding: "0 28px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const cancelBtnStyle = { background: "#fff", color: "#071126", border: "2px solid #000", height: "52px", padding: "0 24px", fontSize: "14px", fontWeight: "800", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "14px 12px", textAlign: "left", fontSize: "13px", fontWeight: "900" };
const tdStyle = { borderBottom: "1px solid #ddd", padding: "14px 12px", fontSize: "13px" };
const emptyRowStyle = { padding: "40px", textAlign: "center", fontSize: "16px", fontWeight: "800", color: "#666" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 24px" };
const formGroupStyle = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle = { fontSize: "12px", fontWeight: "900", color: "#333" };
const inputStyle = { width: "100%", height: "46px", border: "1.5px solid #2f2146", padding: "0 14px", fontSize: "14px", background: "#fff", boxSizing: "border-box" };
const loadingStyle = { textAlign: "center", marginTop: "120px", fontSize: "28px", fontWeight: "800" };
