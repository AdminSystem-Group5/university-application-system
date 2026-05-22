// new application form
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
import { useLanguage } from "@/lib/context/language-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
  const { t } = useLanguage();

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
            setUniversityError(t("student.newApplication.noUniversitiesDb"));
          }
        } catch (universityFetchError) {
          console.error("Universities fetch error:", universityFetchError);
          setUniversityError(t("student.newApplication.unableToLoadUniversities"));
          setUniversities([]);
        } finally {
          setUniversitiesLoading(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("New application page error:", error);
        setErrorMessage(t("student.newApplication.errorLoadingForm"));
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
          setCourseError(t("student.newApplication.noCoursesForUni"));
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Courses fetch error:", error);
        setCourseError(t("student.newApplication.unableToLoadCourses"));
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
    alert(t("student.newApplication.draftSaved"));
  };

  const handleContinue = (e) => {
    e.preventDefault();

    saveApplicationForm(formData, "documents");
    router.push("/student/application/new/documents");
  };

  const universityOptions = universitiesLoading
    ? [{ value: "", label: t("student.newApplication.loadingUniversities"), disabled: true }]
    : universities.length > 0
    ? [
        { value: "", label: t("student.newApplication.selectUniversity") },
        ...universities.map((university) => ({
          value: university.id,
          label: university.name,
        })),
      ]
    : [{ value: "", label: t("student.newApplication.noUniversities"), disabled: true }];

  const courseOptions = !formData.selectedUniversityId
    ? [{ value: "", label: t("student.newApplication.selectUniversityFirst"), disabled: true }]
    : coursesLoading
    ? [{ value: "", label: t("student.newApplication.loadingCourses"), disabled: true }]
    : courses.length > 0
    ? [
        { value: "", label: t("student.newApplication.selectCourse") },
        ...courses.map((course) => ({
          value: course.id,
          label: course.name,
        })),
      ]
    : [{ value: "", label: t("student.newApplication.noCourses"), disabled: true }];

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <h1>{t("student.newApplication.loading")}</h1>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <div style={frameStyle}>
          <h1>{t("student.newApplication.title")}</h1>
          <p style={{ color: "red" }}>{errorMessage}</p>

          <button type="button" onClick={() => router.replace("/student")}>
            {t("student.application.backToDashboard")}
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

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <LanguageSwitcher />
            <button type="button" onClick={handleLogout} style={logoutButton}>
              {t("nav.logout")}
            </button>
          </div>
        </header>

        <section style={titleBarStyle}>
          <button
            type="button"
            onClick={() => router.push("/student")}
            style={backButton}
          >
            {t("student.application.backToDashboard")}
          </button>

          <div style={titleCenterStyle}>
            <h2 style={pageTitleStyle}>{t("student.newApplication.title")}</h2>
            <p style={pageSubtitleStyle}>
              {t("student.newApplication.subtitle")}
            </p>
          </div>
        </section>

        <section style={stepsStyle}>
          <div style={activeStepStyle}>{t("student.newApplication.step1")}</div>
          <div style={stepLineStyle}></div>
          <div style={stepStyle}>{t("student.newApplication.step2")}</div>
          <div style={stepLineStyle}></div>
          <div style={stepStyle}>{t("student.newApplication.step3")}</div>
        </section>

        <form style={formBoxStyle} onSubmit={handleContinue}>
          <FormSection title={t("student.newApplication.personalInfo")}>
            <div style={twoColumnStyle}>
              <InputField
                label={t("student.newApplication.fullName")}
                name="fullName"
                placeholder={t("student.newApplication.fullNamePlaceholder")}
                value={formData.fullName}
                onChange={handleChange}
                required
              />

              <InputField
                label={t("student.newApplication.dateOfBirth")}
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />

              <InputField
                label={t("student.newApplication.nationality")}
                name="nationality"
                placeholder={t("student.newApplication.nationalityPlaceholder")}
                value={formData.nationality}
                onChange={handleChange}
                required
              />

              <InputField
                label={t("student.newApplication.passportNumber")}
                name="passportNumber"
                placeholder={t("student.newApplication.passportPlaceholder")}
                value={formData.passportNumber}
                onChange={handleChange}
                required
              />
            </div>
          </FormSection>

          <FormSection title={t("student.newApplication.academicInfo")}>
            <div style={twoColumnStyle}>
              <SelectField
                label={t("student.newApplication.highestQualification")}
                name="highestQualification"
                value={formData.highestQualification}
                onChange={handleChange}
                required
                options={[
                  t("student.newApplication.selectQualification"),
                  "High School",
                  "Foundation",
                  "Undergraduate",
                  "Postgraduate",
                  "Master",
                ]}
              />

              <InputField
                label={t("student.newApplication.institutionName")}
                name="institutionName"
                placeholder={t("student.newApplication.institutionPlaceholder")}
                value={formData.institutionName}
                onChange={handleChange}
                required
              />

              <InputField
                label={t("student.newApplication.graduationYear")}
                name="graduationYear"
                placeholder={t("student.newApplication.graduationPlaceholder")}
                value={formData.graduationYear}
                onChange={handleChange}
                required
              />

              <InputField
                label={t("student.newApplication.gpaGrade")}
                name="gpaGrade"
                placeholder={t("student.newApplication.gpaPlaceholder")}
                value={formData.gpaGrade}
                onChange={handleChange}
                required
              />
            </div>
          </FormSection>

          <FormSection title={t("student.newApplication.courseInfo")}>
            <div style={twoColumnStyle}>
              <div>
                <SelectField
                  label={t("student.newApplication.selectedUniversity")}
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
                  label={t("student.newApplication.courseName")}
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
                label={t("student.newApplication.intendedIntake")}
                name="intendedIntake"
                value={formData.intendedIntake}
                onChange={handleChange}
                required
                options={[
                  t("student.newApplication.selectIntake"),
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
              {t("student.newApplication.cancel")}
            </button>

            <div style={rightButtonsStyle}>
              <button
                type="button"
                onClick={handleSaveDraft}
                style={draftButton}
              >
                {t("student.newApplication.saveAsDraft")}
              </button>

              <button type="submit" style={continueButton}>
                {t("student.newApplication.continueToDocs")}
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
  width: "100%",
  background: "#F7F1E8",
  padding: "10px",
  fontFamily: "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const frameStyle = {
  minHeight: "calc(100vh - 20px)",
  width: "100%",

  background: "#F7F1E8",
  padding: "0 40px 60px",
  boxSizing: "border-box",
};

const headerStyle = {
  height: "95px",
  width: "100vw",
  position: "relative",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 45px",
  margin: "0 0 24px",
  borderBottom: "2px solid #000",
};

const logoStyle = {
  margin: 0,
  fontSize: "48px",
  fontWeight: "900",
  lineHeight: "48px",
};

const subtitleStyle = {
  margin: "6px 0 0",
  fontSize: "16px",
  lineHeight: "20px",
};

const logoutButton = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  padding: "14px 36px",
  fontSize: "16px",
  fontWeight: "700",
  cursor: "pointer",
};

const titleBarStyle = {
  width: "100%",
  maxWidth: "1700px",
  minHeight: "90px",
  margin: "0 auto 30px",
  border: "2px solid #000",
  background: "#fff",
  display: "grid",
  gridTemplateColumns: "300px 1fr 300px",
  alignItems: "center",
  boxSizing: "border-box",
};

const backButton = {
  marginLeft: "30px",
  background: "#3B2E5A",
  color: "#fff",
  border: "none",
  height: "48px",
  width: "220px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const titleCenterStyle = {
  textAlign: "center",
};

const pageTitleStyle = {
  margin: 0,
  fontSize: "30px",
  fontWeight: "900",
};

const pageSubtitleStyle = {
  margin: "8px 0 0",
  fontSize: "13px",
  fontWeight: "800",
};

const stepsStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto 30px",
  display: "grid",
  gridTemplateColumns: "1fr 120px 1fr 120px 1fr",
  alignItems: "center",
  columnGap: "24px",
};

const activeStepStyle = {
  fontSize: "15px",
  fontWeight: "900",
  borderTop: "2px solid #000",
  paddingTop: "12px",
};

const stepStyle = {
  fontSize: "15px",
  fontWeight: "700",
  borderTop: "2px dotted #000",
  paddingTop: "12px",
  textAlign: "center",
};

const stepLineStyle = {
  borderTop: "2px dotted #000",
};

const formBoxStyle = {
  width: "100%",
  maxWidth: "1700px",
  margin: "0 auto",
  border: "2px solid #000",
  background: "#fff",
  padding: "38px 60px 34px",
  boxSizing: "border-box",
};

const formSectionStyle = {
  borderBottom: "2px solid #000",
  paddingBottom: "34px",
  marginBottom: "34px",
};

const sectionTitleStyle = {
  margin: "0 0 26px",
  fontSize: "20px",
  fontWeight: "900",
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  columnGap: "90px",
  rowGap: "28px",
};

const fullWidthFieldStyle = {
  marginTop: "28px",
  maxWidth: "calc(50% - 45px)",
};

const fieldWrapperStyle = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "900",
  marginBottom: "10px",
};

const inputStyle = {
  height: "54px",
  border: "2px solid #3B2E5A",
  background: "#fff",
  padding: "0 16px",
  fontSize: "15px",
  outline: "none",
};

const errorTextStyle = {
  margin: "10px 0 0",
  color: "red",
  fontSize: "14px",
  fontWeight: "800",
};

const buttonRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: "28px",
};

const rightButtonsStyle = {
  display: "flex",
  gap: "28px",
};

const cancelButton = {
  background: "#fff",
  border: "2px solid #000",
  height: "52px",
  width: "150px",
  fontSize: "14px",
  fontWeight: "800",
  cursor: "pointer",
};

const draftButton = {
  background: "#fff",
  border: "2px solid #3B2E5A",
  color: "#3B2E5A",
  height: "52px",
  width: "170px",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};

const continueButton = {
  background: "#3B2E5A",
  color: "#fff",
  border: "2px solid #3B2E5A",
  height: "52px",
  width: "260px",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
};