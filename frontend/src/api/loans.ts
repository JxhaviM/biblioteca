const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface Loan {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    author: string;
    isbn: string;
    coverImage?: string;
    grado?: string;
  };
  userId: {
    _id: string;
    username: string;
  };
  status: 'pendiente' | 'aprobado' | 'prestado' | 'devuelto' | 'vencido' | 'cancelado';
  loanStartDate: string;
  loanDate?: string; // Fecha real del préstamo cuando se aprueba
  dueDate: string;
  returnDate?: string;
  createdAt?: string; // Fecha de creación de la solicitud
  extensionRequest?: {
    status: 'pending' | 'approved' | 'rejected';
    requestedDays: number;
    reason: string;
    requestedDate: string;
    reviewedBy?: string;
    reviewedAt?: string;
    reviewComments?: string;
    approvedDueDate?: string;
  };
}

export interface CreateLoanRequest {
  bookId: string;
  userId: string;
  loanType?: 'standard' | 'extended';
  notes?: string;
}

export interface ExtensionRequest {
  reason?: string;
  requestedDays?: number;
}

export interface ReviewExtensionRequest {
  approved: boolean;
  reviewComments?: string;
  newDueDate?: string;
}

const loansApi = {
  // Obtener préstamos del usuario actual
  getMyLoans: async (): Promise<{ success: boolean; loans: Loan[]; count: number }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans/my-loans`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener préstamos');
    }

    return response.json();
  },

  // Crear solicitud de préstamo
  createLoan: async (loanData: CreateLoanRequest): Promise<{ success: boolean; message: string; data?: any }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loanData),
    });

    if (!response.ok) {
      throw new Error('Error al crear préstamo');
    }

    return response.json();
  },

  // Solicitar prórroga
  requestExtension: async (loanId: string, extensionData: ExtensionRequest): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}/request-extension`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extensionData),
    });

    if (!response.ok) {
      throw new Error('Error al solicitar prórroga');
    }

    return response.json();
  },

  // Revisar solicitud de prórroga (admin/superadmin)
  reviewExtension: async (loanId: string, reviewData: ReviewExtensionRequest): Promise<{ success: boolean; message: string; data?: any }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}/review-extension`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      throw new Error('Error al revisar solicitud de prórroga');
    }

    return response.json();
  },

  // Devolver libro
  returnBook: async (loanId: string, returnData?: { returnedBy?: string; notes?: string; condition?: string }): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}/return`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(returnData || {}),
    });

    if (!response.ok) {
      throw new Error('Error al devolver libro');
    }

    return response.json();
  },

  // Obtener préstamos por usuario (admin)
  getLoansByUser: async (userId: string, filters?: { status?: string; page?: number; limit?: number }): Promise<{ success: boolean; loans: Loan[]; count: number }> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}/loans/user/${userId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener préstamos del usuario');
    }

    return response.json();
  },

  // Actualizar estado de préstamo
  updateLoan: async (loanId: string, updateData: { status?: string; notes?: string }): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Error al actualizar préstamo');
    }

    return response.json();
  },

  // Obtener préstamos atrasados (admin/superadmin)
  getOverdueLoans: async (filters?: { page?: number; limit?: number }): Promise<{ success: boolean; loans: Loan[]; count: number }> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${API_BASE_URL}/loans/overdue?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener préstamos atrasados');
    }

    return response.json();
  },

  // Aprobar préstamo
  approveLoan: async (loanId: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/loans/${loanId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al aprobar préstamo');
    }

    return response.json();
  },
};

export default loansApi;
