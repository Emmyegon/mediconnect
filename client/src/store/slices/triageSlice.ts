import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
}

export interface VitalSigns {
  temperature?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  respiratoryRate?: number;
}

export interface TriageResult {
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  recommendation: string;
  suggestedAction: 'self-care' | 'schedule-appointment' | 'urgent-care' | 'emergency-room';
  timeToSeekCare: 'immediately' | 'within-hours' | 'within-days' | 'routine';
}

export interface DoctorReview {
  doctor: string;
  notes: string;
  confirmedDiagnosis: string;
  confirmedPriority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  reviewedAt: string;
}

export interface Triage {
  _id: string;
  patient: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  symptoms: Symptom[];
  additionalSymptoms: string[];
  painLevel: number;
  vitalSigns: VitalSigns;
  triageResult: TriageResult;
  riskFactors: string[];
  medicalHistory: Array<{
    condition: string;
    status: 'active' | 'resolved' | 'chronic';
  }>;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
  }>;
  allergies: string[];
  triageScore: number;
  isCompleted: boolean;
  followUpRequired: boolean;
  followUpDate?: string;
  notes?: string;
  doctorReview?: DoctorReview;
  createdAt: string;
  updatedAt: string;
}

interface TriageState {
  triages: Triage[];
  currentTriage: Triage | null;
  urgentTriages: Triage[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pages: number;
}

const initialState: TriageState = {
  triages: [],
  currentTriage: null,
  urgentTriages: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pages: 1,
};

// Async thunks
export const submitTriage = createAsyncThunk(
  'triage/submitTriage',
  async (triageData: {
    symptoms: Symptom[];
    painLevel: number;
    vitalSigns?: VitalSigns;
    riskFactors?: string[];
    medicalHistory?: Array<{
      condition: string;
      status: 'active' | 'resolved' | 'chronic';
    }>;
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
    }>;
    allergies?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/triage', triageData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit triage');
    }
  }
);

export const fetchTriageHistory = createAsyncThunk(
  'triage/fetchTriageHistory',
  async ({ patientId, page = 1, limit = 10 }: {
    patientId: string;
    page?: number;
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/triage/patient/${patientId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch triage history');
    }
  }
);

export const fetchTriage = createAsyncThunk(
  'triage/fetchTriage',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/triage/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch triage');
    }
  }
);

export const updateTriage = createAsyncThunk(
  'triage/updateTriage',
  async ({ id, triageData }: {
    id: string;
    triageData: {
      notes?: string;
      followUpRequired?: boolean;
      followUpDate?: string;
      isCompleted?: boolean;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/triage/${id}`, triageData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update triage');
    }
  }
);

export const fetchUrgentTriages = createAsyncThunk(
  'triage/fetchUrgentTriages',
  async ({ page = 1, limit = 10 }: {
    page?: number;
    limit?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/triage/urgent', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch urgent triages');
    }
  }
);

export const fetchTriageStats = createAsyncThunk(
  'triage/fetchTriageStats',
  async (params: { startDate?: string; endDate?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/triage/stats', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch triage statistics');
    }
  }
);

export const addDoctorNotes = createAsyncThunk(
  'triage/addDoctorNotes',
  async ({ id, doctorNotes, confirmedDiagnosis, confirmedPriority }: {
    id: string;
    doctorNotes: string;
    confirmedDiagnosis?: string;
    confirmedPriority?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/triage/${id}/doctor-notes`, {
        doctorNotes,
        confirmedDiagnosis,
        confirmedPriority
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add doctor notes');
    }
  }
);

const triageSlice = createSlice({
  name: 'triage',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentTriage: (state) => {
      state.currentTriage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit triage
      .addCase(submitTriage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitTriage.fulfilled, (state, action) => {
        state.loading = false;
        state.triages.unshift(action.payload.data);
        state.currentTriage = action.payload.data;
      })
      .addCase(submitTriage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch triage history
      .addCase(fetchTriageHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTriageHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.triages = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchTriageHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch single triage
      .addCase(fetchTriage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTriage.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTriage = action.payload.data;
      })
      .addCase(fetchTriage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update triage
      .addCase(updateTriage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTriage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.triages.findIndex(triage => triage._id === action.payload.data._id);
        if (index !== -1) {
          state.triages[index] = action.payload.data;
        }
        if (state.currentTriage?._id === action.payload.data._id) {
          state.currentTriage = action.payload.data;
        }
      })
      .addCase(updateTriage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch urgent triages
      .addCase(fetchUrgentTriages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUrgentTriages.fulfilled, (state, action) => {
        state.loading = false;
        state.urgentTriages = action.payload.data;
      })
      .addCase(fetchUrgentTriages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add doctor notes
      .addCase(addDoctorNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDoctorNotes.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.triages.findIndex(triage => triage._id === action.payload.data._id);
        if (index !== -1) {
          state.triages[index] = action.payload.data;
        }
        if (state.currentTriage?._id === action.payload.data._id) {
          state.currentTriage = action.payload.data;
        }
      })
      .addCase(addDoctorNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentTriage } = triageSlice.actions;
export default triageSlice.reducer;



