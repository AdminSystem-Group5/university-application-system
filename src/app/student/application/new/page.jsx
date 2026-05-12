"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

const FORM_STORAGE_KEY = "uaams_new_application_form";
const LEGACY_FORM_STORAGE_KEY = "studentApplicationDraft";

const DOCUMENTS_STORAGE_KEY = "uaams_new_application_documents";
const LEGACY_DOCUMENTS_STORAGE_KEY = "studentApplicationDocuments";
const REVIEW_STORAGE_KEY = "uaams_new_application_review";
const CURRENT_STEP_STORAGE_KEY = "uaams_application_current_step";

const DEFAULT_FORM_DATA = {
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
};

export default function NewApplicationPage() {
  const router = useRouter();

  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [universityError, setUniversityError] = useState("");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseError, setCourseError] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA });

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
        return;
      }

      try {
        const shouldResetApplication = isResetRequested();

        if (shouldResetApplication) {
          clearNewApplicationStorage();
          removeResetQueryFromUrl();
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setErrorMessage("Student profile not found.");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const userRole = String(userData?.role || "").trim().toLowerCase();

        if (userRole !== "student") {
          router.replace("/admin");
          return;
        }

        const savedFormData = shouldResetApplication
          ? {}
          : loadSavedApplicationForm();

        const mergedFormData = {
          ...DEFAULT_FORM_DATA,
          ...savedFormData,
        };

        setFormData(mergedFormData);

        setUniversitiesLoading(true);
        setUniversityError("");

        try {
          const fetchedUniversities = await fetchUniversities(db);
          setUniversities(fetchedUniversities);

          if (fetchedUniversities.length === 0) {
            setUniversityError("No universities found in the database.");
          }
        } catch (universityFetchError) {
          console.error("Universities fetch error:", universityFetchError);
          setUniversityError("Unable to load universities from the database.");
          setUniversities([]);
        } finally {
          setUniversitiesLoading(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("New application page error:", error);
        setErrorMessage("Unable to load application form.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!formData.selectedUniversityId) {
      setCourses([]);
      setCourseError("");
      return;
    }

    let cancelled = false;

    async function loadCourses() {
      const db = getFirestoreDb();

      setCoursesLoading(true);
      setCourseError("");

      try {
        const fetchedCourses = await fetchCoursesByUniversity(
          db,
          formData.selectedUniversityId
        );

        if (cancelled) return;

        setCourses(fetchedCourses);

        if (fetchedCourses.length === 0) {
          setCourseError("No courses found for this university.");
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Courses fetch error:", error);
        setCourseError("Unable to load courses for this university.");
        setCourses([]);
      } finally {
        if (!cancelled) {
          setCoursesLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, [formData.selectedUniversityId]);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    router.replace("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "selectedUniversityId") {
      const selectedUniversity = universities.find(
        (university) => university.id === value
      );

      setFormData((prev) => ({
        ...prev,
        selectedUniversityId: value,
        selectedUniversity: selectedUniversity?.name || "",
        selectedCourseId: "",
        courseName: "",
      }));

      return;
    }

    if (name === "selectedCourseId") {
      const selectedCourse = courses.find((course) => course.id === value);

      setFormData((prev) => ({
        ...prev,
        selectedCourseId: value,
        courseName: selectedCourse?.name || "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDraft = () => {
    saveApplicationForm(formData, "form");
    alert("Application saved as draft.");
  };

  const handleContinue = (e) => {
    e.preventDefault();

    saveApplicationForm(formData, "documents");
    router.push("/student/application/new/documents");
  };

  const universityOptions = universitiesLoading
    ? [{ value: "", label: "LOADING UNIVERSITIES...", disabled: true }]
    : universities.length > 0
    ? [
        { value: "", label: "SELECT UNIVERSITY" },
        ...universities.map((university) => ({
          value: university.id,
          label: university.name,
        })),
      ]
    : [{ value: "", label: "NO UNIVERSITIES FOUND", disabled: true }];

  const courseOptions = !formData.selectedUniversityId
    ? [{ value: "", label: "SELECT UNIVERSITY FIRST", disabled: true }]
    : coursesLoading
    ? [{ value: "", label: "LOADING COURSES...", disabled: true }]
    : courses.length > 0
    ? [
        { value: "", label: "SELECT COURSE" },
        ...courses.map((course) => ({
          value: course.id,
          label: course.name,
        })),
      ]
    : [{ value: "", label: "NO COURSES FOUND", disabled: true }];

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <h1>Loading application form...</h1>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <h1>New Application</h1>
          <p style={{ color: "red" }}>{errorMessage}</p>

          <button type="button" onClick={() => router.replace("/student")}>
            BACK TO DASHBOARD
          </button>
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
            <p style={subtitleStyle}>
              University Administration & Application
              <br />
              Management System
            </p>
          </div>

          <button type="button" onClick={handleLogout} style={logoutButton}>
            LOGOUT
          </button>
        </header>

        <section style={titleBarStyle}>
          <button
            type="button"
            onClick={() => router.push("/student")}
            style={backButton}
          >
            BACK TO DASHBOARD
          </button>

          <div style={titleCenterStyle}>
            <h2 style={pageTitleStyle}>NEW APPLICATION</h2>
            <p style={pageSubtitleStyle}>
              COMPLETE THE FORM BELOW TO SUBMIT YOUR UNIVERSITY APPLICATION.
            </p>
          </div>
        </section>

        <section style={stepsStyle}>
          <div style={activeStepStyle}>STEP 1 : APPLICATION FORM</div>
          <div style={stepLineStyle}></div>
          <div style={stepStyle}>STEP 2 : UPLOAD DOCUMENTS</div>
          <div style={stepLineStyle}></div>
          <div style={stepStyle}>STEP 3 : REVIEW & SUBMIT</div>
        </section>

        <form style={formBoxStyle} onSubmit={handleContinue}>
          <FormSection title="A. PERSONAL INFORMATION">
            <div style={twoColumnStyle}>
              <InputField
                label="FULL NAME *"
                name="fullName"
                placeholder="ENTER YOUR FULL NAME"
                value={formData.fullName}
                onChange={handleChange}
                required
              />

              <InputField
                label="DATE OF BIRTH *"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />

              <InputField
                label="NATIONALITY *"
                name="nationality"
                placeholder="ENTER YOUR NATIONALITY"
                value={formData.nationality}
                onChange={handleChange}
                required
              />

              <InputField
                label="PASSPORT NUMBER *"
                name="passportNumber"
                placeholder="ENTER YOUR PASSPORT NUMBER"
                value={formData.passportNumber}
                onChange={handleChange}
                required
              />
            </div>
          </FormSection>

          <FormSection title="B. ACADEMIC INFORMATION">
            <div style={twoColumnStyle}>
              <SelectField
                label="HIGHEST QUALIFICATION *"
                name="highestQualification"
                value={formData.highestQualification}
                onChange={handleChange}
                required
                options={[
                  "SELECT QUALIFICATION",
                  "High School",
                  "Foundation",
                  "Undergraduate",
                  "Postgraduate",
                  "Master",
                ]}
              />

              <InputField
                label="INSTITUTION NAME *"
                name="institutionName"
                placeholder="INSTITUTION NAME"
                value={formData.institutionName}
                onChange={handleChange}
                required
              />

              <InputField
                label="GRADUATION YEAR *"
                name="graduationYear"
                placeholder="E.G. 2023"
                value={formData.graduationYear}
                onChange={handleChange}
                required
              />

              <InputField
                label="GPA/GRADE *"
                name="gpaGrade"
                placeholder="E.G. 3.8 OR A"
                value={formData.gpaGrade}
                onChange={handleChange}
                required
              />
            </div>
          </FormSection>

          <FormSection title="C. COURSE INFORMATION">
            <div style={twoColumnStyle}>
              <div>
                <SelectField
                  label="SELECTED UNIVERSITY *"
                  name="selectedUniversityId"
                  value={formData.selectedUniversityId}
                  onChange={handleChange}
                  required
                  disabled={universitiesLoading}
                  options={universityOptions}
                />

                {universityError && (
                  <p style={errorTextStyle}>{universityError}</p>
                )}
              </div>

              <div>
                <SelectField
                  label="COURSE NAME *"
                  name="selectedCourseId"
                  value={formData.selectedCourseId}
                  onChange={handleChange}
                  required
                  disabled={!formData.selectedUniversityId || coursesLoading}
                  options={courseOptions}
                />

                {courseError && <p style={errorTextStyle}>{courseError}</p>}
              </div>
            </div>

            <div style={fullWidthFieldStyle}>
              <SelectField
                label="INTENDED INTAKE *"
                name="intendedIntake"
                value={formData.intendedIntake}
                onChange={handleChange}
                required
                options={[
                  "SELECT INTAKE",
                  "January 2026",
                  "May 2026",
                  "September 2026",
                  "January 2027",
                ]}
              />
            </div>
          </FormSection>

          <div style={buttonRowStyle}>
            <button
              type="button"
              onClick={() => router.push("/student")}
              style={cancelButton}
            >
              CANCEL
            </button>

            <div style={rightButtonsStyle}>
              <button
                type="button"
                onClick={handleSaveDraft}
                style={draftButton}
              >
                SAVE AS DRAFT
              </button>

              <button type="submit" style={continueButton}>
                CONTINUE TO DOCUMENTS
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function isResetRequested() {
  if (typeof window === "undefined") return false;

  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get("reset") === "true";
}

function removeResetQueryFromUrl() {
  if (typeof window === "undefined") return;

  window.history.replaceState(null, "", "/student/application/new");
}

function clearNewApplicationStorage() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(FORM_STORAGE_KEY);
  sessionStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  sessionStorage.removeItem(REVIEW_STORAGE_KEY);
  sessionStorage.removeItem(CURRENT_STEP_STORAGE_KEY);

  localStorage.removeItem(FORM_STORAGE_KEY);
  localStorage.removeItem(LEGACY_FORM_STORAGE_KEY);
  localStorage.removeItem(DOCUMENTS_STORAGE_KEY);
  localStorage.removeItem(LEGACY_DOCUMENTS_STORAGE_KEY);
  localStorage.removeItem(REVIEW_STORAGE_KEY);
  localStorage.removeItem(CURRENT_STEP_STORAGE_KEY);
}

function saveApplicationForm(data, nextStep = "form") {
  const cleanedData = {
    ...DEFAULT_FORM_DATA,
    ...data,
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(cleanedData));
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(cleanedData));
    localStorage.setItem(LEGACY_FORM_STORAGE_KEY, JSON.stringify(cleanedData));

    sessionStorage.setItem(CURRENT_STEP_STORAGE_KEY, nextStep);
    localStorage.setItem(CURRENT_STEP_STORAGE_KEY, nextStep);
  }
}

function loadSavedApplicationForm() {
  if (typeof window === "undefined") {
    return {};
  }

  const saved =
    sessionStorage.getItem(FORM_STORAGE_KEY) ||
    localStorage.getItem(FORM_STORAGE_KEY) ||
    localStorage.getItem(LEGACY_FORM_STORAGE_KEY);

  if (!saved) {
    return {};
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Saved form data could not be parsed:", error);
    return {};
  }
}

async function fetchUniversities(db) {
  const universitiesRef = collection(db, "universities");
  const universitiesSnap = await getDocs(universitiesRef);

  return universitiesSnap.docs
    .map((universityDoc) => {
      const data = universityDoc.data();

      const universityName =
        data?.name ||
        data?.universityName ||
        data?.institutionName ||
        data?.displayName ||
        data?.title ||
        universityDoc.id;

      return {
        id: universityDoc.id,
        name: String(universityName).trim(),
        active: data?.active,
      };
    })
    .filter((university) => university.name && university.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchCoursesByUniversity(db, universityId) {
  const coursesRef = collection(db, "courses");

  const coursesQuery = query(
    coursesRef,
    where("universityId", "==", universityId)
  );

  const coursesSnap = await getDocs(coursesQuery);

  return coursesSnap.docs
    .map((courseDoc) => {
      const data = courseDoc.data();

      const courseName =
        data?.courseName ||
        data?.name ||
        data?.title ||
        data?.programmeName ||
        courseDoc.id;

      return {
        id: courseDoc.id,
        name: String(courseName).trim(),
        code: data?.courseCode || "",
        active: data?.active,
      };
    })
    .filter((course) => course.name && course.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function FormSection({ title, children }) {
  return (
    <section style={formSectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </section>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <label style={fieldWrapperStyle}>
      <span style={labelStyle}>{label}</span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}) {
  return (
    <label style={fieldWrapperStyle}>
      <span style={labelStyle}>{label}</span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        style={{
          ...inputStyle,
          opacity: disabled ? 0.7 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {options.map((option, index) => {
          const optionValue =
            typeof option === "string" ? (index === 0 ? "" : option) : option.value;

          const optionLabel =
            typeof option === "string" ? option : option.label;

          const optionDisabled =
            typeof option === "string" ? false : option.disabled;

          return (
            <option
              key={`${optionLabel}-${index}`}
              value={optionValue}
              disabled={optionDisabled}
            >
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#F7F1E8",
  padding: "6px",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const frameStyle = {
  minHeight: "calc(100vh - 12px)",
  border: "1.5px solid #000",
  background: "#F7F1E8",
  padding: "0 130px 50px",
};

const headerStyle = {
  height: "70px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  margin: "0 -130px 0",
  borderBottom: "1px solid rgba(0,0,0,0.12)",
};

const logoStyle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: "800",
  lineHeight: "24px",
};

const subtitleStyle = {
  margin: "2px 0 0",
  fontSize: "10px",
  lineHeight: "12px",
};

const logoutButton = {
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#3B2E5A",
  padding: "8px 26px",
  fontSize: "11px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleBarStyle = {
  maxWidth: "900px",
  margin: "0 auto 20px",
  border: "1.5px solid #000",
  background: "#fff",
  height: "50px",
  display: "grid",
  gridTemplateColumns: "220px 1fr 220px",
  alignItems: "center",
};

const backButton = {
  marginLeft: "52px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  height: "28px",
  width: "160px",
  fontSize: "10px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleCenterStyle = {
  textAlign: "center",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "17px",
  fontWeight: "800",
};

const pageSubtitleStyle = {
  margin: "2px 0 0",
  fontSize: "9px",
  fontWeight: "700",
};

const stepsStyle = {
  maxWidth: "900px",
  margin: "0 auto 18px",
  display: "grid",
  gridTemplateColumns: "1fr 80px 1fr 80px 1fr",
  alignItems: "center",
  columnGap: "18px",
};

const activeStepStyle = {
  fontSize: "10px",
  fontWeight: "800",
  borderTop: "1px solid #000",
  paddingTop: "6px",
};

const stepStyle = {
  fontSize: "10px",
  fontWeight: "500",
  borderTop: "1px dotted #000",
  paddingTop: "6px",
  textAlign: "center",
};

const stepLineStyle = {
  borderTop: "1px dotted #000",
};

const formBoxStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  border: "1.5px solid #000",
  background: "#fff",
  padding: "22px 54px 16px",
};

const formSectionStyle = {
  borderBottom: "1px solid #000",
  paddingBottom: "18px",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  margin: "0 0 14px",
  fontSize: "12px",
  fontWeight: "800",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  columnGap: "150px",
  rowGap: "16px",
};

const fullWidthFieldStyle = {
  marginTop: "16px",
};

const fieldWrapperStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "9px",
  fontWeight: "800",
  marginBottom: "5px",
};

const inputStyle = {
  height: "32px",
  border: "1.5px solid #3B2E5A",
  background: "#fff",
  padding: "0 10px",
  fontSize: "10px",
  outline: "none",
};

const errorTextStyle = {
  margin: "6px 0 0",
  color: "red",
  fontSize: "10px",
  fontWeight: "700",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "10px",
};

const rightButtonsStyle = {
  display: "flex",
  gap: "24px",
};

const cancelButton = {
  background: "#fff",
  border: "1.5px solid #000",
  height: "34px",
  width: "88px",
  fontSize: "10px",
  fontWeight: "700",
  cursor: "pointer",
};

const draftButton = {
  background: "#fff",
  border: "1.5px solid #3B2E5A",
  color: "#3B2E5A",
  height: "34px",
  width: "90px",
  fontSize: "9px",
  fontWeight: "700",
  cursor: "pointer",
};

const continueButton = {
  background: "#3B2E5A",
  color: "#fff",
  border: "1.5px solid #3B2E5A",
  height: "34px",
  width: "150px",
  fontSize: "9px",
  fontWeight: "700",
  cursor: "pointer",
};