// frontend/src/api.js

const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


// ============================================================
// Session helpers
// ============================================================

function getSession() {
  return {
    accessToken: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    role: localStorage.getItem("role"), // "student" | "admin"
  };
}


function setSession(tokens, role) {
  localStorage.setItem(
    "access_token",
    tokens.access_token
  );

  localStorage.setItem(
    "refresh_token",
    tokens.refresh_token
  );

  localStorage.setItem(
    "role",
    role
  );
}


function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
}


// ============================================================
// Error handling
// ============================================================

async function parseError(response) {
  try {
    const body = await response.json();

    if (typeof body.detail === "string") {
      return body.detail;
    }

    if (body.detail?.message) {
      const missing =
        body.detail.missing_prerequisites;

      return missing?.length
        ? `${body.detail.message} (missing: ${missing.join(", ")})`
        : body.detail.message;
    }

    return JSON.stringify(
      body.detail ?? body
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
}


// ============================================================
// Refresh access token
// ============================================================

async function refreshAccessToken() {
  const {
    refreshToken,
    role,
  } = getSession();

  if (!refreshToken) {
    throw new Error(
      "No refresh token available"
    );
  }

  const res = await fetch(
    `${API_BASE}/auth/refresh`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    }
  );

  if (!res.ok) {
    clearSession();

    throw new Error(
      "Session expired - please log in again"
    );
  }

  const data = await res.json();

  setSession(
    data,
    role
  );

  return data.access_token;
}


// ============================================================
// Main request helper
// ============================================================

async function request(
  path,
  {
    method = "GET",
    body,
    auth = true,
    retry = true,
  } = {}
) {
  const headers = {
    "Content-Type":
      "application/json",
  };

  if (auth) {
    const {
      accessToken,
    } = getSession();

    if (accessToken) {
      headers.Authorization =
        `Bearer ${accessToken}`;
    }
  }

  const res = await fetch(
    `${API_BASE}${path}`,
    {
      method,
      headers,

      body: body
        ? JSON.stringify(body)
        : undefined,
    }
  );

  // ----------------------------------------------------------
  // Access token expired
  // ----------------------------------------------------------

  if (
    res.status === 401 &&
    auth &&
    retry
  ) {
    try {
      await refreshAccessToken();

      return request(
        path,
        {
          method,
          body,
          auth,
          retry: false,
        }
      );
    } catch {
      clearSession();

      window.location.reload();

      return null;
    }
  }

  if (!res.ok) {
    throw new Error(
      await parseError(res)
    );
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}


// ============================================================
// File upload helper
// ============================================================

async function uploadFile(
  path,
  file,
  {
    retry = true,
  } = {}
) {
  const {
    accessToken,
  } = getSession();

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  const res = await fetch(
    `${API_BASE}${path}`,
    {
      method: "POST",

      headers: accessToken
        ? {
            Authorization:
              `Bearer ${accessToken}`,
          }
        : {},

      body: formData,
    }
  );

  if (
    res.status === 401 &&
    retry
  ) {
    try {
      await refreshAccessToken();

      return uploadFile(
        path,
        file,
        {
          retry: false,
        }
      );
    } catch {
      clearSession();

      window.location.reload();

      return null;
    }
  }

  if (!res.ok) {
    throw new Error(
      await parseError(res)
    );
  }

  return res.json();
}


// ============================================================
// API
// ============================================================

export const api = {

  // ==========================================================
  // Session
  // ==========================================================

  request,

  getRole: () =>
    getSession().role,

  isLoggedIn: () =>
    Boolean(
      getSession().accessToken
    ),

  logout: () =>
    clearSession(),


  // ==========================================================
  // Student passwordless authentication
  // ==========================================================

  requestPin: (payload) =>
    request(
      "/auth/request-pin",
      {
        method: "POST",
        body: payload,
        auth: false,
      }
    ),


  studentLogin: async (
    payload
  ) => {
    const tokens =
      await request(
        "/auth/login",
        {
          method: "POST",
          body: payload,
          auth: false,
        }
      );

    setSession(
      tokens,
      "student"
    );

    return tokens;
  },


  me: () =>
    request(
      "/auth/me"
    ),


  // ==========================================================
  // Admin authentication
  // ==========================================================

  adminLogin: async (
    payload
  ) => {
    const tokens =
      await request(
        "/admin/login",
        {
          method: "POST",
          body: payload,
          auth: false,
        }
      );

    setSession(
      tokens,
      "admin"
    );

    return tokens;
  },


  adminMe: () =>
    request(
      "/admin/me"
    ),


  // ==========================================================
  // Programmes & modules
  // Public endpoints
  // ==========================================================

  listProgrammes: () =>
    request(
      "/programmes",
      {
        auth: false,
      }
    ),


  getCurriculum: (
    code
  ) =>
    request(
      `/programmes/${code}/curriculum`,
      {
        auth: false,
      }
    ),


  listModules: (
    params = {}
  ) => {
    const qs =
      new URLSearchParams(
        params
      ).toString();

    return request(
      `/modules${qs ? `?${qs}` : ""}`,
      {
        auth: false,
      }
    );
  },


  // ==========================================================
  // Student progress
  // ==========================================================

  getSummary: () =>
    request(
      "/progress/summary"
    ),


  getHistory: (
    status
  ) =>
    request(
      `/progress/history${
        status
          ? `?status=${status}`
          : ""
      }`
    ),


  getDegreeProgress: () =>
    request(
      "/progress/degree-progress"
    ),


  getSemesters: () =>
  request(
    "/progress/semesters"
  ),


// Yearly Breakdown
getYearlyBreakdown: () =>
  request(
    "/progress/yearly-breakdown"
  ),


getModuleDetail: (
  code
) =>
  request(
    `/progress/modules/${code}/detail`
  ),


  // ==========================================================
  // Graduation planning
  // ==========================================================

  getEligibleModules: () =>
    request(
      "/planning/eligible-modules"
    ),


  getGraduationAudit: () =>
    request(
      "/planning/graduation-audit"
    ),


  // ==========================================================
  // Grade Predictor
  // ==========================================================

  predictGrades: (
    payload
  ) =>
    request(
      "/progress/predict-grades",
      {
        method: "POST",
        body: payload,
      }
    ),


  // ==========================================================
  // Semester Planner
  // ==========================================================

  getPlanningModules: () =>
    request(
      "/planning/planning-modules"
    ),


  generatePlan: (
    payload
  ) =>
    request(
      "/planning/plan",
      {
        method: "POST",
        body: payload,
      }
    ),


  savePlan: (
    payload
  ) =>
    request(
      "/planning/save-plan",
      {
        method: "POST",
        body: payload,
      }
    ),


  // ==========================================================
  // Achievements
  // ==========================================================

  getAchievements: () =>
    request(
      "/progress/achievements"
    ),


  // ==========================================================
  // Peer Comparison
  // NEW
  // ==========================================================

  getPeerComparison: () =>
    request(
      "/progress/peer-comparison"
    ),


  // ==========================================================
  // Admin dashboard
  // ==========================================================

  adminGetDashboard: () =>
    request(
      "/admin/dashboard"
    ),


  adminGetProgrammeBreakdown: () =>
    request(
      "/admin/programme-breakdown"
    ),


  // ==========================================================
  // Admin student management
  // ==========================================================

  adminListStudents: (
    params = {}
  ) => {
    const qs =
      new URLSearchParams(
        params
      ).toString();

    return request(
      `/admin/students${
        qs
          ? `?${qs}`
          : ""
      }`
    );
  },


  adminCreateStudent: (
    payload
  ) =>
    request(
      "/admin/students",
      {
        method: "POST",
        body: payload,
      }
    ),


  adminGetStudent: (
    id
  ) =>
    request(
      `/admin/students/${id}`
    ),


  adminGetStudentSummary: (
    id
  ) =>
    request(
      `/admin/students/${id}/summary`
    ),


  adminUpdateStudent: (
    id,
    payload
  ) =>
    request(
      `/admin/students/${id}`,
      {
        method: "PATCH",
        body: payload,
      }
    ),


  adminDeactivateStudent: (
    id
  ) =>
    request(
      `/admin/students/${id}`,
      {
        method: "DELETE",
      }
    ),


  adminRecordMark: (
    id,
    payload
  ) =>
    request(
      `/admin/students/${id}/marks`,
      {
        method: "POST",
        body: payload,
      }
    ),


  adminRegeneratePin: (
    id
  ) =>
    request(
      `/admin/students/${id}/regenerate-pin`,
      {
        method: "POST",
      }
    ),


  adminUploadStudentsCsv: (
    file
  ) =>
    uploadFile(
      "/admin/students/upload",
      file
    ),


  adminUploadMarksCsv: (
    file
  ) =>
    uploadFile(
      "/admin/marks/upload",
      file
    ),


  // ==========================================================
  // Admin impersonation
  // ==========================================================

  adminImpersonate: (
    studentId
  ) =>
    request(
      `/admin/impersonate/${studentId}`,
      {
        method: "POST",
      }
    ),


  adminStopImpersonation: () =>
    request(
      "/admin/stop-impersonation",
      {
        method: "POST",
      }
    ),


  // ==========================================================
  // Admin Module Management
  // ==========================================================

  adminCreateModule: (
    payload
  ) =>
    request(
      "/modules",
      {
        method: "POST",
        body: payload,
      }
    ),


  adminUpdateModule: (
    code,
    payload
  ) =>
    request(
      `/modules/${code}`,
      {
        method: "PATCH",
        body: payload,
      }
    ),


  adminDeleteModule: (
    code
  ) =>
    request(
      `/modules/${code}`,
      {
        method: "DELETE",
      }
    ),


  // ==========================================================
  // Admin Prerequisite Management
  // ==========================================================

  adminGetPrerequisites: (
    code
  ) =>
    request(
      `/modules/${code}/prerequisites`
    ),


  adminSetPrerequisites: (
    code,
    payload
  ) =>
    request(
      `/modules/${code}/prerequisites`,
      {
        method: "PUT",
        body: payload,
      }
    ),


  adminAddPrerequisite: (
    code,
    prereqCode
  ) =>
    request(
      `/modules/${code}/prerequisites/${prereqCode}`,
      {
        method: "POST",
      }
    ),


  adminRemovePrerequisite: (
    code,
    prereqCode
  ) =>
    request(
      `/modules/${code}/prerequisites/${prereqCode}`,
      {
        method: "DELETE",
      }
    ),


  // ==========================================================
  // Admin Programme-Module Management
  // ==========================================================

  adminGetProgrammeModules: (
    code
  ) =>
    request(
      `/programmes/${code}/modules`
    ),


  adminAddModuleToProgramme: (
    code,
    payload
  ) =>
    request(
      `/programmes/${code}/modules`,
      {
        method: "POST",
        body: payload,
      }
    ),


  adminUpdateProgrammeModule: (
    code,
    moduleCode,
    payload
  ) =>
    request(
      `/programmes/${code}/modules/${moduleCode}`,
      {
        method: "PATCH",
        body: payload,
      }
    ),


  adminRemoveModuleFromProgramme: (
    code,
    moduleCode
  ) =>
    request(
      `/programmes/${code}/modules/${moduleCode}`,
      {
        method: "DELETE",
      }
    ),


  // ==========================================================
  // Admin Account Management
  // ==========================================================

  adminListAdmins: (
    params
  ) =>
    request(
      `/admin-management${
        params
          ? `?${new URLSearchParams(
              params
            )}`
          : ""
      }`
    ),


  adminCreateAdmin: (
    payload
  ) =>
    request(
      "/admin-management",
      {
        method: "POST",
        body: payload,
      }
    ),


  adminGetAdmin: (
    id
  ) =>
    request(
      `/admin-management/${id}`
    ),


  adminUpdateAdmin: (
    id,
    payload
  ) =>
    request(
      `/admin-management/${id}`,
      {
        method: "PATCH",
        body: payload,
      }
    ),


  adminDeleteAdmin: (
    id
  ) =>
    request(
      `/admin-management/${id}`,
      {
        method: "DELETE",
      }
    ),


  adminReactivateAdmin: (
    id
  ) =>
    request(
      `/admin-management/${id}/reactivate`,
      {
        method: "POST",
      }
    ),


  adminResetOwnPassword: (
    payload
  ) =>
    request(
      "/admin-management/reset-password",
      {
        method: "POST",
        body: payload,
      }
    ),


  adminResetAdminPassword: (
    id,
    payload
  ) =>
    request(
      `/admin-management/${id}/reset-password`,
      {
        method: "POST",
        body: payload,
      }
    ),

  
      // ==========================================================
  // Student Community
  // ==========================================================

  getMyCommunity: () =>
    request("/community/me"),

  getProgrammeCommunity: () =>
    request("/community/all-years"),

  getCommunityMessages: (channelId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/community/channels/${channelId}/messages${qs ? `?${qs}` : ""}`);
  },

  sendCommunityMessage: (channelId, payload) =>
    request(`/community/channels/${channelId}/messages`, {
      method: "POST",
      body: payload,
    }),

  deleteCommunityMessage: (messageId) =>
    request(`/community/messages/${messageId}`, {
      method: "DELETE",
    }),

  toggleCommunityReaction: (messageId, emoji) =>
    request(`/community/messages/${messageId}/reactions`, {
      method: "POST",
      body: { emoji },
    }),


  // ==========================================================
  // AI Assistant
  // ==========================================================

  assistantChat: (payload) =>
    request(
      "/assistant/chat",
      {
        method: "POST",
        body: payload,
        auth: false,
      }
    ),

  // ==========================================================
  // AI Assistant - Streaming
  // ==========================================================

  assistantChatStream: async (payload, onChunk) => {
    const { accessToken } = getSession();

    const headers = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${API_BASE}/assistant/chat/stream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const message = await parseError(response);

      throw new Error(message);
    }

    if (!response.body) {
      throw new Error(
        "Streaming is not supported by this browser."
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { value, done } =
          await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(
          value,
          {
            stream: true,
          }
        );

        if (chunk) {
          onChunk(chunk);
        }
      }

      const finalChunk = decoder.decode();

      if (finalChunk) {
        onChunk(finalChunk);
      }
    } finally {
      reader.releaseLock();
    }
  },

  // ==========================================================
  // Admin Profile
  // ==========================================================

  adminGetMyProfile: () =>
    request(
      "/admin-management/me"
    ),
};


// ============================================================
// Exports
// ============================================================

export {
  setSession,
  clearSession,
};