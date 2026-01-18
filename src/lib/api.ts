const API_PREFIX = "/api";
let lastInvoiceId: number | null = null;
async function backendFetch(path: string, init?: RequestInit) {
  const token = localStorage.getItem("token") || "";
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${API_PREFIX}${path}`, { ...init, headers });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}
// Mock API service for Edu-Pay

export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
  name: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  course: string;
  year: string;
  branch: string;
  phone: string;
  address: string;
  outstanding?: number;
}

type BackendStudent = {
  id: number;
  name: string;
  email?: string;
  regno?: string;
  rollNumber?: string;
  course?: string;
  year?: string;
  branch?: string;
  phone?: string;
  address?: string;
};

export interface FeeStructure {
  id: string;
  component: string;
  amount: number;
  mandatory: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  paymentDate: string;
  dueDate: string;
  transactionId?: string;
  receiptUrl?: string;
}

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    rollNumber: 'CS2021001',
    course: 'B.Tech',
    year: '3rd Year',
    branch: 'Computer Science',
    phone: '+91 9876543210',
    address: 'Mumbai, Maharashtra'
  },
  {
    id: '2',
    name: 'Priya Singh',
    email: 'priya@example.com',
    rollNumber: 'EC2021045',
    course: 'B.Tech',
    year: '3rd Year',
    branch: 'Electronics',
    phone: '+91 9876543211',
    address: 'Delhi, India'
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    rollNumber: 'ME2022012',
    course: 'B.Tech',
    year: '2nd Year',
    branch: 'Mechanical',
    phone: '+91 9876543212',
    address: 'Ahmedabad, Gujarat'
  }
];

const mockFeeStructure: FeeStructure[] = [
  { id: '1', component: 'Tuition Fee', amount: 45000, mandatory: true },
  { id: '2', component: 'Hostel Fee', amount: 25000, mandatory: false },
  { id: '3', component: 'Lab Fee', amount: 8000, mandatory: true },
  { id: '4', component: 'Library Fee', amount: 3000, mandatory: true },
  { id: '5', component: 'Sports Fee', amount: 2000, mandatory: false },
  { id: '6', component: 'Late Fee', amount: 500, mandatory: false }
];

const mockPayments: Payment[] = [
  {
    id: '1',
    studentId: '1',
    studentName: 'Rahul Sharma',
    amount: 56000,
    status: 'paid',
    paymentDate: '2025-01-15',
    dueDate: '2025-01-31',
    transactionId: 'TXN001234567',
    receiptUrl: '/receipts/receipt_001.pdf'
  },
  {
    id: '2',
    studentId: '2',
    studentName: 'Priya Singh',
    amount: 56000,
    status: 'pending',
    paymentDate: '',
    dueDate: '2025-01-31'
  },
  {
    id: '3',
    studentId: '3',
    studentName: 'Amit Patel',
    amount: 56000,
    status: 'pending',
    paymentDate: '',
    dueDate: '2025-01-31'
  }
];

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      const json = await backendFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (json?.success && json?.data?.token && json?.data?.user) {
        const u = json.data.user;
        return {
          user: { id: String(u.id), email: u.email, role: u.role, name: u.name },
          token: json.data.token,
        };
      }
    } catch (e) {
      console.warn("backend auth login failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (email === "admin@edupay.com" && password === "admin123") {
      return {
        user: { id: "admin1", email: "admin@edupay.com", role: "admin", name: "Admin User" },
        token: "mock-admin-token",
      };
    }
    if (email === "rahul@example.com" && password === "student123") {
      return {
        user: { id: "1", email: "rahul@example.com", role: "student", name: "Rahul Sharma" },
        token: "mock-student-token",
      };
    }
    throw new Error("Invalid credentials");
  },
  
  signup: async (email: string, password: string, name: string, role: 'student' | 'admin'): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      user: {
        id: Math.random().toString(36).substr(2, 9),
        email,
        role,
        name
      },
      token: 'mock-token-' + Math.random().toString(36).substr(2, 9)
    };
  }
};

// Students API
export const studentsApi = {
  getAll: async (): Promise<Student[]> => {
    try {
      const json = await backendFetch("/students");
      if (json?.success && Array.isArray(json.data)) {
        return json.data.map((s: BackendStudent) => ({
          id: String(s.id),
          name: s.name,
          email: s.email,
          rollNumber: s.regno || s.rollNumber || "",
          course: s.course || "",
          year: (s.year as string) || "",
          branch: (s.branch as string) || "",
          phone: s.phone || "",
          address: (s.address as string) || "",
        }));
      }
    } catch (e) {
      console.warn("backend students getAll failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockStudents;
  },
  
  getById: async (id: string): Promise<Student> => {
    try {
      const json = await backendFetch(`/students/${Number(id)}`);
      if (json?.success && json.data) {
        const s = json.data;
        return {
          id: String(s.id),
          name: s.name,
          email: s.email,
          rollNumber: s.regno || "",
          course: s.course || "",
          year: (s.year as string) || "",
          branch: (s.branch as string) || "",
          phone: s.phone || "",
          address: (s.address as string) || "",
          outstanding: typeof s.outstanding === "number" ? s.outstanding : undefined,
        };
      }
    } catch (e) {
      console.warn("backend students getById failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const student = mockStudents.find(s => s.id === id);
    if (!student) throw new Error('Student not found');
    return student;
  },
  
  create: async (student: Omit<Student, 'id'>): Promise<Student> => {
    try {
      const payload = {
        name: student.name,
        regno: student.rollNumber,
        course: student.course,
        phone: student.phone,
        email: student.email,
      };
      const json = await backendFetch("/students", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (json?.success && json.data) {
        const s = json.data;
        const created: Student = {
          id: String(s.id),
          name: s.name,
          email: s.email,
          rollNumber: s.regno || "",
          course: s.course || "",
          year: student.year || "",
          branch: student.branch || "",
          phone: s.phone || student.phone || "",
          address: student.address || "",
        };
        mockStudents.push(created);
        return created;
      }
    } catch (e) {
      console.warn("backend students create failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const newStudent = { ...student, id: Math.random().toString(36).substr(2, 9) };
    mockStudents.push(newStudent);
    return newStudent;
  },
  
  update: async (id: string, student: Partial<Student>): Promise<Student> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockStudents.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Student not found');
    mockStudents[index] = { ...mockStudents[index], ...student };
    return mockStudents[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
      mockStudents.splice(index, 1);
    }
  }
};

// Fee Structure API
export const feeStructureApi = {
  getAll: async (): Promise<FeeStructure[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockFeeStructure;
  },
  
  create: async (fee: Omit<FeeStructure, 'id'>): Promise<FeeStructure> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newFee = { ...fee, id: Math.random().toString(36).substr(2, 9) };
    mockFeeStructure.push(newFee);
    return newFee;
  },
  
  update: async (id: string, fee: Partial<FeeStructure>): Promise<FeeStructure> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockFeeStructure.findIndex(f => f.id === id);
    if (index === -1) throw new Error('Fee component not found');
    mockFeeStructure[index] = { ...mockFeeStructure[index], ...fee };
    return mockFeeStructure[index];
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockFeeStructure.findIndex(f => f.id === id);
    if (index !== -1) {
      mockFeeStructure.splice(index, 1);
    }
  }
};

// Payments API
export const paymentsApi = {
  getAll: async (): Promise<Payment[]> => {
    try {
      const json = await backendFetch("/payments");
      if (json?.success && Array.isArray(json.data)) {
        const rows = json.data as Array<{
          id: number;
          studentId: number;
          invoiceId: number;
          amount: number;
          currency: string;
          status: string;
          razorpayPaymentId?: string | null;
          createdAt?: string;
          updatedAt?: string;
        }>;
        const uniqueStudentIds = Array.from(new Set(rows.map(r => r.studentId).filter(Boolean)));
        const studentsMap: Record<number, string> = {};
        await Promise.all(uniqueStudentIds.map(async (sid) => {
          try {
            const sres = await backendFetch(`/students/${sid}`);
            if (sres?.success && sres.data?.name) {
              studentsMap[sid] = sres.data.name as string;
            }
          } catch {
            void 0;
          }
        }));
        return rows.map(r => {
          const paid = ["captured", "success", "paid"].includes(String(r.status).toLowerCase());
          const amountRupees = Math.round(r.amount) / 100;
          const paymentDate = paid ? (r.updatedAt || r.createdAt || "") : "";
          const dueDate = r.createdAt || new Date().toISOString();
          const receiptUrl = paid ? `/api/payments/${r.invoiceId}/receipt` : undefined;
          return {
            id: String(r.id),
            studentId: String(r.studentId),
            studentName: studentsMap[r.studentId] || `Student #${r.studentId}`,
            amount: amountRupees,
            status: paid ? "paid" : (String(r.status).toLowerCase() === "failed" ? "failed" : "pending"),
            paymentDate,
            dueDate,
            transactionId: r.razorpayPaymentId || undefined,
            receiptUrl,
          } as Payment;
        });
      }
    } catch (e) {
      console.warn("backend payments getAll failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPayments;
  },
  
  getByStudentId: async (studentId: string): Promise<Payment[]> => {
    try {
      const json = await backendFetch(`/payments?studentId=${Number(studentId)}`);
      if (json?.success && Array.isArray(json.data)) {
        const rows = json.data as Array<{
          id: number;
          studentId: number;
          amount: number;
          currency: string;
          status: string;
          razorpayPaymentId?: string | null;
          createdAt?: string;
          updatedAt?: string;
          invoiceId: number;
        }>;
        return rows.map(r => {
          const paid = ["captured", "success", "paid"].includes(String(r.status).toLowerCase());
          const amountRupees = Math.round(r.amount) / 100;
          const paymentDate = paid ? (r.updatedAt || r.createdAt || "") : "";
          const dueDate = r.createdAt || new Date().toISOString();
          const receiptUrl = paid ? `/api/payments/${r.invoiceId}/receipt` : undefined;
          return {
            id: String(r.id),
            studentId: String(r.studentId),
            studentName: `Student #${r.studentId}`,
            amount: amountRupees,
            status: paid ? "paid" : (String(r.status).toLowerCase() === "failed" ? "failed" : "pending"),
            paymentDate,
            dueDate,
            transactionId: r.razorpayPaymentId || undefined,
            receiptUrl,
          } as Payment;
        });
      }
    } catch (e) {
      console.warn("backend payments getByStudentId failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPayments.filter(p => p.studentId === studentId);
  },
  
  createOrder: async (amount: number, studentId: string): Promise<{ orderId: string; amount: number; keyId?: string }> => {
    try {
      const json = await backendFetch("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ studentId: Number(studentId), amount, currency: "INR", items: [], meta: {} }),
      });
      if (json?.success && json?.data?.orderId) {
        lastInvoiceId = json.data.invoiceId ?? null;
        return { orderId: json.data.orderId, amount: json.data.amount, keyId: json.data.keyId };
      }
    } catch (e) {
      console.warn("backend create-order failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return { orderId: "order_" + Math.random().toString(36).substr(2, 9), amount: Math.round(amount * 100) };
  },
  
  verifyPayment: async (paymentId: string, orderId: string, signature: string): Promise<Payment> => {
    try {
      const json = await backendFetch("/payments/verify", {
        method: "POST",
        body: JSON.stringify({ razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, invoiceId: lastInvoiceId }),
      });
      if (json?.success && json?.data?.status === "success") {
        const paid: Payment = {
          id: Math.random().toString(36).substr(2, 9),
          studentId: "1",
          studentName: "Rahul Sharma",
          amount: 56000,
          status: "paid",
          paymentDate: new Date().toISOString().split("T")[0],
          dueDate: "2025-01-31",
          transactionId: paymentId,
          receiptUrl: json.data.receiptUrl,
        };
        mockPayments.push(paid);
        return paid;
      }
    } catch (e) {
      console.warn("backend verify payment failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: "1",
      studentName: "Rahul Sharma",
      amount: 56000,
      status: Math.random() > 0.2 ? "paid" : "failed",
      paymentDate: new Date().toISOString().split("T")[0],
      dueDate: "2025-01-31",
      transactionId: paymentId,
      receiptUrl: "/receipts/receipt_" + Math.random().toString(36).substr(2, 9) + ".pdf",
    };
    if (newPayment.status === "paid") {
      mockPayments.push(newPayment);
    }
    return newPayment;
  }
};

// Reports API
export const reportsApi = {
  getDashboardStats: async () => {
    try {
      const reports = await backendFetch("/reports");
      const students = await backendFetch("/students");
      const paymentsCaptured = await backendFetch("/payments?status=captured");
      if (reports?.success) {
        const totalCollectedRupees = (reports.data.totalCollected || 0) / 100;
        const defaulters = Array.isArray(reports.data.defaulters) ? reports.data.defaulters : [];
        const pendingDuesRupees = defaulters.reduce((sum: number, d: { amount: number }) => sum + (d.amount || 0), 0) / 100;
        const totalStudents = Array.isArray(students?.data) ? students.data.length : 0;
        const studentsNotPaid = defaulters.length;
        const studentsPaid = Math.max(totalStudents - studentsNotPaid, 0);

        const byCoursePaise: Array<{ course: string; amount: number }> = Array.isArray(reports.data.byCourse)
          ? reports.data.byCourse
          : [];
        const collectionByCourse = byCoursePaise.map((item) => ({ course: item.course, amount: (item.amount || 0) / 100 }));

        const capturedRows: Array<{ createdAt: string; amount: number }> = Array.isArray(paymentsCaptured?.data)
          ? paymentsCaptured.data
          : [];
        const yearMap: Record<string, number> = {};
        for (const row of capturedRows) {
          const y = (row.createdAt || "").slice(0, 4) || new Date().getFullYear().toString();
          yearMap[y] = (yearMap[y] || 0) + (row.amount || 0);
        }
        const collectionByYear = Object.entries(yearMap)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([year, amountPaise]) => ({ year, amount: (amountPaise || 0) / 100 }));

        return {
          totalCollection: totalCollectedRupees,
          pendingDues: pendingDuesRupees,
          studentsPaid,
          studentsNotPaid,
          collectionByYear,
          collectionByCourse,
        };
      }
    } catch (e) {
      console.warn("backend reports getDashboardStats failed", e);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalCollection: 156000,
      pendingDues: 112000,
      studentsPaid: 1,
      studentsNotPaid: 2,
      collectionByYear: [
        { year: '1st Year', amount: 0 },
        { year: '2nd Year', amount: 56000 },
        { year: '3rd Year', amount: 100000 },
        { year: '4th Year', amount: 0 }
      ],
      collectionByCourse: [
        { course: 'Computer Science', amount: 56000 },
        { course: 'Electronics', amount: 0 },
        { course: 'Mechanical', amount: 0 }
      ]
    };
  },
  
  exportPDF: async (type: 'daily' | 'weekly' | 'yearly', opts?: { from?: string; to?: string }) => {
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ type, format: 'pdf' });
      if (opts?.from) params.set('from', opts.from);
      if (opts?.to) params.set('to', opts.to);
      const res = await fetch(`${API_PREFIX}/reports/export?${params.toString()}` , {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const filename = `BEC_${type}_report.pdf`;
        return { success: true, blob, filename };
      }
    } catch (e) {
      console.warn("backend reports exportPDF failed", e);
    }
    try {
      const reports = await backendFetch("/reports");
      const byCourse: Array<{ course: string; amount: number }> = (reports?.data?.byCourse || []) as Array<{ course: string; amount: number }>;
      const defaulters: Array<{ studentId: number; amount: number }> = (reports?.data?.defaulters || []) as Array<{ studentId: number; amount: number }>;
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"/><title>Basaveshwar Engineering College (BEC) ${type} Report</title></head><body><h1>Basaveshwar Engineering College (BEC) ${type} Report</h1><h2>Total Collected: ₹${((reports?.data?.totalCollected||0)/100).toLocaleString()}</h2><h3>By Course</h3><ul>${byCourse.map((c)=>`<li>${c.course}: ₹${(c.amount/100).toLocaleString()}</li>`).join('')}</ul><h3>Defaulters</h3><ul>${defaulters.map((d)=>`<li>Student #${d.studentId}: ₹${(d.amount/100).toLocaleString()}</li>`).join('')}</ul></body></html>`;
      const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      return { success: true, url: blobUrl } as any;
    } catch {}
    const blobUrl = URL.createObjectURL(new Blob(["Basaveshwar Engineering College (BEC) Report"], { type: "text/plain" }));
    return { success: true, url: blobUrl } as any;
  },
  
  exportCSV: async (type: 'daily' | 'weekly' | 'yearly', opts?: { from?: string; to?: string }) => {
    try {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams({ type, format: 'csv' });
      if (opts?.from) params.set('from', opts.from);
      if (opts?.to) params.set('to', opts.to);
      const res = await fetch(`${API_PREFIX}/reports/export?${params.toString()}` , {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const filename = `BEC_${type}_report.csv`;
        return { success: true, blob, filename };
      }
    } catch (e) {
      console.warn("backend reports exportCSV failed", e);
    }
    try {
      const reports = await backendFetch("/reports");
      const lines: string[] = [];
      lines.push("Section,Key,Value");
      lines.push(`Summary,TotalCollected,${(reports?.data?.totalCollected||0)/100}`);
      lines.push("Course,Name,Amount");
      for (const item of (reports?.data?.byCourse||[])) {
        lines.push(`Course,${item.course},${item.amount/100}`);
      }
      lines.push("Defaulter,StudentId,Amount");
      for (const d of (reports?.data?.defaulters||[])) {
        lines.push(`Defaulter,${d.studentId},${d.amount/100}`);
      }
      const csv = lines.join("\n");
      const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      return { success: true, url: blobUrl } as any;
    } catch {}
    const blobUrl = URL.createObjectURL(new Blob(["Section,Key,Value\nSummary,TotalCollected,0"], { type: "text/csv" }));
    return { success: true, url: blobUrl } as any;
  }
};
