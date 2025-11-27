import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  Users,
  BookOpen,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Book,
  Library,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUserContext } from '../contexts/UserContext';
import {
  getSystemStats,
  getUsersReport,
  getBooksReport,
  getLoansReport,
} from "../api/reports";

interface SystemStats {
  summary: {
    totalBooks: number;
    totalUsers: number;
    totalLoans: number;
    activeLoans: number;
    overdueLoans: number;
    availabilityRate: number;
  };
  monthlyActivity: { _id: string; loans: number }[];
  popularBooks: Array<{
    book: {
      title: string;
      author: string;
      isbn: string;
      coverImage?: string;
    };
    loanCount: number;
  }>;
  loanStatusDistribution: { _id: string; count: number }[];
  period: {
    from: string;
    to: string;
  };
}

interface UserReport {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string;
  person?: {
    nombre1: string;
    apellido1: string;
    tipoPersona: string;
  };
  loansCount: number;
  activeLoans: number;
}

interface BookReport {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string[];
  publishedYear: number;
  availability: {
    total: number;
    available: number;
    borrowed: number;
  };
  createdAt: string;
  loansCount: number;
  activeLoans: number;
  totalTimesLoaned: number;
}

interface LoanReport {
  _id: string;
  loanDate: string;
  loanStartDate?: string;
  createdAt?: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  loanType: string;
  loanedBy?: string;
  bookId?: {
    title: string;
    author: string;
    isbn: string;
  };
  userId?: {
    username: string;
    role: string;
  };
  user?: {
    username: string;
    role: string;
  };
  book?: {
    title: string;
    author: string;
    isbn: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ReportsPageProps {}

const ReportsPage: React.FC<ReportsPageProps> = () => {
  const { user: authUser } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersReport, setUsersReport] = useState<UserReport[]>([]);
  const [booksReport, setBooksReport] = useState<BookReport[]>([]);
  const [loansReport, setLoansReport] = useState<LoanReport[]>([]);

  const [selectedReport, setSelectedReport] = useState("overview");
  const [dateRange] = useState({
    start: "2024-01-01",
    end: "2024-12-31",
  });
  const [userFilters] = useState({ role: "", status: "" });
  const [bookFilters] = useState({ genre: "", availability: "" });
  const [loanFilters] = useState({ status: "", type: "" });

  const [usersPage, setUsersPage] = useState(1);
  const [booksPage] = useState(1);
  const [loansPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);

  const reportTypes = [
    { id: "overview", name: "Vista General", icon: BarChart3 },
    { id: "users", name: "Reporte de Usuarios", icon: Users },
    { id: "books", name: "Reporte de Libros", icon: Book },
    { id: "loans", name: "Reporte de Préstamos", icon: Library },
  ];

  const userRole = authUser?.role || "user";
  const isSuperAdmin = userRole === "superadmin";

  useEffect(() => {
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await getSystemStats(userRole, authUser?._id);
      setStats(response.data);
      toast.success("Estadísticas cargadas exitosamente");
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersReport = async () => {
    try {
      const response = await getUsersReport(userRole, {
        page: usersPage,
        limit: 20,
        role: userFilters.role,
        status: userFilters.status,
      });
      setUsersReport(Array.isArray(response.data) ? response.data : []);
      setUsersPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching users report:", error);
      toast.error("Error al cargar reporte de usuarios");
      setUsersReport([]);
      setUsersPagination(null);
    }
  };

  const fetchBooksReport = async () => {
    try {
      const response = await getBooksReport(userRole, {
        page: booksPage,
        limit: 20,
        genre: bookFilters.genre,
        availability: bookFilters.availability,
      });
      setBooksReport(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching books report:", error);
      toast.error("Error al cargar reporte de libros");
      setBooksReport([]);
    }
  };

  const fetchLoansReport = async () => {
    try {
      const response = await getLoansReport(userRole, {
        page: loansPage,
        limit: 20,
        status: loanFilters.status,
        type: loanFilters.type,
      });
      setLoansReport(Array.isArray(response.data?.loans) ? response.data.loans : []);
    } catch (error) {
      console.error("Error fetching loans report:", error);
      toast.error("Error al cargar reporte de préstamos");
      setLoansReport([]);
    }
  };

  useEffect(() => {
    if (selectedReport === "users") fetchUsersReport();
    if (selectedReport === "books") fetchBooksReport();
    if (selectedReport === "loans") fetchLoansReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, usersPage, booksPage, loansPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

    const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    change,
  }: {
    title: string;
    value: number;
    icon: React.ElementType;
    color: string;
    change?: number;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-2 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? "+" : ""}
              {change}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              {isSuperAdmin ? "Reportes y Estadísticas del Sistema" : "Reportes y Estadísticas de Biblioteca"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSuperAdmin ? "Vista completa de todas las operaciones y usuarios del sistema" : "Estadísticas de préstamos, usuarios y actividades de la biblioteca"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{dateRange.start} - {dateRange.end}</span>
            </div>
            <button
              onClick={fetchStats}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar datos"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-8">
          <div className="flex space-x-1">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedReport === type.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedReport === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total de Usuarios" value={stats.summary.totalUsers} icon={Users} color="bg-blue-600" change={8.2} />
              <StatCard title="Total de Libros" value={stats.summary.totalBooks} icon={BookOpen} color="bg-green-600" change={3.1} />
              <StatCard title="Total de Préstamos" value={stats.summary.totalLoans} icon={Library} color="bg-purple-600" change={12.5} />
              <StatCard title="Préstamos Activos" value={stats.summary.activeLoans} icon={Library} color="bg-orange-600" change={5.8} />
            </div>
            
            {/* Sección adicional: Libros más populares */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 text-green-600 mr-2" />
                Libros más populares del mes
              </h3>
              <div className="space-y-3">
                {stats.popularBooks?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.book.title}</p>
                        <p className="text-sm text-gray-500">{item.book.author}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.loanCount} préstamos
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedReport === "users" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              Reporte de Usuarios
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamos Totales</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamos Activos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersReport.map((user, index) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {(usersPage - 1) * 20 + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.loansCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.activeLoans || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Paginación */}
            {usersPagination && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {(usersPage - 1) * 20 + 1} a {Math.min(usersPage * 20, usersPagination.total)} de {usersPagination.total} usuarios
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                    disabled={usersPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-blue-50 text-blue-700">
                    {usersPage} de {usersPagination.pages}
                  </span>
                  <button
                    onClick={() => setUsersPage(Math.min(usersPagination.pages, usersPage + 1))}
                    disabled={usersPage === usersPagination.pages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedReport === "books" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Book className="h-5 w-5 text-green-600 mr-2" />
              Reporte de Libros
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veces Prestado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Préstamos Activos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {booksReport.map((book) => (
                    <tr key={book._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{book.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.isbn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.totalTimesLoaned || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {book.activeLoans || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === "loans" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Library className="h-5 w-5 text-purple-600 mr-2" />
              Reporte de Préstamos
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Libro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitud</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Préstamo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Devolución</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprobado por</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loansReport.map((loan) => (
                    <tr key={loan._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{loan.bookId?.title || 'Sin libro'}</div>
                        <div className="text-sm text-gray-500">{loan.bookId?.author || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.userId?.username || 'Sin usuario'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.loanStartDate ? new Date(loan.loanStartDate).toLocaleDateString() : 'Cancelado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          loan.status === 'prestado' ? 'bg-green-100 text-green-800' :
                          loan.status === 'devuelto' ? 'bg-blue-100 text-blue-800' :
                          loan.status === 'disponible' ? 'bg-gray-100 text-gray-800' :
                          loan.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {loan.status === 'disponible' ? 'Solicitado' : 
                           loan.status === 'prestado' ? 'Activo' :
                           loan.status === 'devuelto' ? 'Devuelto' :
                           loan.status === 'cancelado' ? 'Cancelado' : loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loan.loanedBy || 'Sistema'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
