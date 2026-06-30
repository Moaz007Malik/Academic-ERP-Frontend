import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAccessToken, getAccessToken } from '../../services/api';
import { getPortalRouteForRole } from '../../utils/constants';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email: email.trim(), password });
      setAccessToken(data.data.accessToken);
      return data.data;
    } catch (err) {
      const resData = err.response?.data;
      const message = resData?.message
        || (resData?.details?.length ? resData.details.join(', ') : null)
        || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    if (!getAccessToken()) return null;
    try {
      const { data } = await api.get('/auth/me');
      return data.data;
    } catch (err) {
      setAccessToken(null);
      return rejectWithValue(err.response?.data?.message || 'Session expired');
    }
  }
);

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    initializing: true,
    error: null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSession(state) {
      setAccessToken(null);
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload.user,
          modules: action.payload.user.modules ?? [],
          instituteStatus: action.payload.user.instituteStatus,
          subscriptionExpired: action.payload.user.subscriptionExpired ?? false,
          portalRoute: action.payload.user.portalRoute,
        };
        state.initializing = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(initializeAuth.pending, (state) => { state.initializing = true; })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.initializing = false;
        if (action.payload) {
          state.user = {
            ...action.payload,
            modules: action.payload.modules ?? [],
            instituteStatus: action.payload.instituteStatus ?? action.payload.institute?.status,
            subscriptionExpired: action.payload.subscriptionExpired ?? false,
            portalRoute: action.payload.portalRoute ?? getPortalRouteForRole(action.payload.role),
            instituteName: action.payload.instituteName ?? action.payload.institute?.name,
          };
          state.isAuthenticated = true;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.initializing = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = {
          ...action.payload,
          instituteStatus: action.payload.instituteStatus ?? action.payload.institute?.status,
          subscriptionExpired: action.payload.subscriptionExpired ?? false,
        };
        state.isAuthenticated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        // Only clear session if token is already gone (avoid race with fresh login)
        if (!getAccessToken()) {
          state.isAuthenticated = false;
          state.user = null;
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, clearSession } = authSlice.actions;
export default authSlice.reducer;
