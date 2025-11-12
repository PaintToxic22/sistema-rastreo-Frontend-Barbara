import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';

interface Encomienda {
  _id?: string;
  codigoSeguimiento: string;
  remitente: { nombre: string; email?: string; telefono?: string };
  destinatario: { nombre: string; email?: string; telefono?: string };
  valor: number;
  estado: 'pendiente' | 'en_transito' | 'entregada' | 'incidencia' | 'cancelada';
  descripcion?: string;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'operador' | 'chofer' | 'usuario';
  estado: 'activo' | 'inactivo';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  // ===== ESTADO DE LA INTERFAZ =====
  seccion: string = 'dashboard';
  loading = false;
  tema: 'light' | 'dark' = 'light';
  idioma: string = 'es';

  // ===== DATOS =====
  encomiendas: Encomienda[] = [];
  usuarios: Usuario[] = [];
  estadisticas = {
    activas: 156,
    transito: 23,
    incidencias: 3,
    entregadas: 1247,
    ingresos: 6200000
  };

  // ===== BÚSQUEDA =====
  formBusqueda = { codigo: '' };
  encomiendasBuscadas: Encomienda[] = [];
  mostrarResultadosBusqueda = false;

  // ===== NUEVA ENCOMIENDA =====
  formNuevaEncomienda = {
    remitente: { nombre: '', email: '', telefono: '' },
    destinatario: { nombre: '', email: '', telefono: '' },
    descripcion: '',
    valor: 0
  };

  // ===== ORDEN DE FLETE =====
  formOrden = {
    chofer: '',
    vehiculo: '',
    encomiendas: ''
  };
  ordenesCreadas: any[] = [];

  // ===== CONFIGURACIÓN =====
  empresaConfig = {
    nombre: 'LonquiExpress',
    email: 'info@lonquiexpress.cl',
    telefono: '+56912345678'
  };

  // ===== NUEVO USUARIO =====
  formNuevoUsuario = {
    nombre: '',
    email: '',
    rol: 'operador',
    password: ''
  };

  // ===== CONTROL =====
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.inicializarDatos();
  }

  ngOnInit() {
    this.verificarAutenticacion();
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== AUTENTICACIÓN =====
  verificarAutenticacion() {
    const usuario = this.authService.currentUser();
    const rol = this.authService.obtenerRol();
    if (!usuario || rol !== 'admin') {
      this.router.navigate(['/login']);
    }
  }

  // ===== INICIALIZACIÓN =====
  private inicializarDatos() {
    // Encomiendas de ejemplo
    this.encomiendas = [
      {
        _id: '1',
        codigoSeguimiento: 'LQ001234567',
        remitente: { nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '912345678' },
        destinatario: { nombre: 'María González', email: 'maria@example.com', telefono: '912345679' },
        valor: 45000,
        estado: 'entregada',
        descripcion: 'Documento importante'
      },
      {
        _id: '2',
        codigoSeguimiento: 'LQ001234568',
        remitente: { nombre: 'Carlos López', email: 'carlos@example.com', telefono: '912345680' },
        destinatario: { nombre: 'Ana Martínez', email: 'ana@example.com', telefono: '912345681' },
        valor: 65000,
        estado: 'en_transito',
        descripcion: 'Paquete frágil'
      },
      {
        _id: '3',
        codigoSeguimiento: 'LQ001234569',
        remitente: { nombre: 'Roberto Silva', email: 'roberto@example.com', telefono: '912345682' },
        destinatario: { nombre: 'Laura Torres', email: 'laura@example.com', telefono: '912345683' },
        valor: 35000,
        estado: 'pendiente',
        descripcion: 'Envío estándar'
      }
    ];

    // Usuarios de ejemplo
    this.usuarios = [
      { id: '1', nombre: 'Admin User', email: 'admin@lonquiexpress.cl', rol: 'admin', estado: 'activo' },
      { id: '2', nombre: 'Operador 1', email: 'operador1@lonquiexpress.cl', rol: 'operador', estado: 'activo' },
      { id: '3', nombre: 'Chofer Carlos', email: 'chofer@lonquiexpress.cl', rol: 'chofer', estado: 'activo' }
    ];
  }

  private cargarDatos() {
    this.loading = true;
    setTimeout(() => {
      this.calcularEstadisticas();
      this.loading = false;
    }, 500);
  }

  // ===== ESTADÍSTICAS =====
  private calcularEstadisticas() {
    this.estadisticas.activas = this.encomiendas.length;
    this.estadisticas.transito = this.encomiendas.filter(e => e.estado === 'en_transito').length;
    this.estadisticas.entregadas = this.encomiendas.filter(e => e.estado === 'entregada').length;
    this.estadisticas.incidencias = this.encomiendas.filter(e => e.estado === 'incidencia').length;
    this.estadisticas.ingresos = this.encomiendas.reduce((sum, e) => sum + e.valor, 0);
  }

  // ===== NAVEGACIÓN =====
  mostrarSeccion(seccion: string) {
    this.seccion = seccion;
  }

  // ===== ENCOMIENDAS =====

  /**
   * ✅ REGISTRAR NUEVA ENCOMIENDA
   */
  registrarEncomienda() {
    if (!this.formNuevaEncomienda.remitente.nombre || !this.formNuevaEncomienda.destinatario.nombre) {
      alert('❌ Completa todos los campos obligatorios');
      return;
    }

    const nuevaEncomienda: Encomienda = {
      _id: Math.random().toString(),
      codigoSeguimiento: `LQ${Date.now()}`,
      remitente: this.formNuevaEncomienda.remitente,
      destinatario: this.formNuevaEncomienda.destinatario,
      valor: this.formNuevaEncomienda.valor || 0,
      estado: 'pendiente',
      descripcion: this.formNuevaEncomienda.descripcion
    };

    this.encomiendas.push(nuevaEncomienda);
    this.calcularEstadisticas();
    
    alert(`✅ Encomienda registrada: ${nuevaEncomienda.codigoSeguimiento}`);
    this.formNuevaEncomienda = {
      remitente: { nombre: '', email: '', telefono: '' },
      destinatario: { nombre: '', email: '', telefono: '' },
      descripcion: '',
      valor: 0
    };
    this.mostrarSeccion('encomiendas');
  }

  /**
   * ✅ BUSCAR ENCOMIENDA POR CÓDIGO
   */
  buscarEncomienda() {
    const codigo = this.formBusqueda.codigo.trim().toUpperCase();
    
    if (!codigo) {
      alert('❌ Ingresa un código de seguimiento');
      return;
    }

    this.encomiendasBuscadas = this.encomiendas.filter(e =>
      e.codigoSeguimiento.toUpperCase().includes(codigo)
    );

    this.mostrarResultadosBusqueda = true;

    if (this.encomiendasBuscadas.length === 0) {
      alert(`❌ No se encontraron encomiendas con: ${codigo}`);
    } else {
      alert(`✅ ${this.encomiendasBuscadas.length} encomienda(s) encontrada(s)`);
    }
  }

  /**
   * ✅ ACTUALIZAR ESTADO DE ENCOMIENDA
   */
  actualizarEstadoEncomienda(encomienda: Encomienda, nuevoEstado: string) {
    const index = this.encomiendas.findIndex(e => e._id === encomienda._id);
    if (index !== -1) {
      this.encomiendas[index].estado = nuevoEstado as any;
      this.calcularEstadisticas();
      alert(`✅ Estado actualizado a: ${nuevoEstado}`);
    }
  }

  /**
   * ✅ ELIMINAR ENCOMIENDA
   */
  eliminarEncomienda(encomienda: Encomienda) {
    if (confirm(`¿Eliminar encomienda ${encomienda.codigoSeguimiento}?`)) {
      this.encomiendas = this.encomiendas.filter(e => e._id !== encomienda._id);
      this.calcularEstadisticas();
      alert('✅ Encomienda eliminada');
    }
  }

  // ===== ÓRDENES DE FLETE =====

  /**
   * ✅ CREAR ORDEN DE FLETE
   */
  crearOrden() {
    if (!this.formOrden.chofer || !this.formOrden.vehiculo) {
      alert('❌ Completa chofer y vehículo');
      return;
    }

    const nuevaOrden = {
      _id: Math.random().toString(),
      numeroOrden: `ORD-${this.ordenesCreadas.length + 1}`,
      chofer: this.formOrden.chofer,
      vehiculo: this.formOrden.vehiculo,
      encomiendas: this.formOrden.encomiendas.split(',').map(e => e.trim()),
      estado: 'pendiente',
      fechaCreacion: new Date()
    };

    this.ordenesCreadas.push(nuevaOrden);
    alert(`✅ Orden creada: ${nuevaOrden.numeroOrden}`);
    
    this.formOrden = { chofer: '', vehiculo: '', encomiendas: '' };
  }

  /**
   * ✅ ELIMINAR ORDEN
   */
  eliminarOrden(orden: any) {
    if (confirm(`¿Eliminar orden ${orden.numeroOrden}?`)) {
      this.ordenesCreadas = this.ordenesCreadas.filter(o => o._id !== orden._id);
      alert('✅ Orden eliminada');
    }
  }

  // ===== REPORTES Y EXPORTACIÓN =====

  /**
   * ✅ EXPORTAR A CSV (FUNCIONA 100%)
   */
  exportarCSV() {
    const headers = ['Código', 'Remitente', 'Destinatario', 'Valor', 'Estado'];
    const data = this.encomiendas.map(e => [
      e.codigoSeguimiento,
      e.remitente.nombre,
      e.destinatario.nombre,
      e.valor,
      e.estado
    ]);

    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `encomiendas-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Archivo CSV descargado');
  }

  /**
   * ✅ EXPORTAR A PDF
   */
  exportarPDF() {
    alert('📄 Para exportar a PDF, instala: npm install jspdf pdfmake\n\nLuego usa cualquiera de estas librerías para generar el PDF');
  }

  /**
   * ✅ EXPORTAR A EXCEL
   */
  exportarExcel() {
    alert('📊 Para exportar a Excel, instala: npm install xlsx\n\nLuego usa la librería xlsx para crear el archivo Excel');
  }

  /**
   * ✅ GENERAR REPORTE GENERAL
   */
  generarReporte() {
    const reporte = `
REPORTE GENERAL - LONQUIEXPRESS
=====================================
Fecha: ${new Date().toLocaleDateString('es-CL')}

RESUMEN:
- Total de encomiendas: ${this.estadisticas.activas}
- En tránsito: ${this.estadisticas.transito}
- Entregadas: ${this.estadisticas.entregadas}
- Incidencias: ${this.estadisticas.incidencias}
- Ingresos totales: $${this.estadisticas.ingresos.toLocaleString('es-CL')}
    `;
    
    alert(reporte);
  }

  // ===== USUARIOS =====

  /**
   * ✅ CREAR NUEVO USUARIO
   */
  crearNuevoUsuario() {
    if (!this.formNuevoUsuario.nombre || !this.formNuevoUsuario.email) {
      alert('❌ Completa nombre y email');
      return;
    }

    const nuevoUsuario: Usuario = {
      id: Math.random().toString(),
      nombre: this.formNuevoUsuario.nombre,
      email: this.formNuevoUsuario.email,
      rol: this.formNuevoUsuario.rol as any,
      estado: 'activo'
    };

    this.usuarios.push(nuevoUsuario);
    alert(`✅ Usuario creado: ${nuevoUsuario.email}`);
    
    this.formNuevoUsuario = { nombre: '', email: '', rol: 'operador', password: '' };
  }

  /**
   * ✅ ELIMINAR USUARIO
   */
  eliminarUsuario(usuario: Usuario) {
    if (confirm(`¿Eliminar usuario ${usuario.email}?`)) {
      this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
      alert('✅ Usuario eliminado');
    }
  }

  /**
   * ✅ CAMBIAR ESTADO USUARIO
   */
  cambiarEstadoUsuario(usuario: Usuario) {
    usuario.estado = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    alert(`✅ Estado cambiado a: ${usuario.estado}`);
  }

  // ===== PERSONALIZACIÓN =====

  /**
   * ✅ CAMBIAR TEMA
   */
  cambiarTema(nuevoTema: 'light' | 'dark') {
    this.tema = nuevoTema;
    localStorage.setItem('tema', nuevoTema);
    
    if (nuevoTema === 'dark') {
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      document.body.style.backgroundColor = '#f8f9fa';
      document.body.style.color = '#000000';
    }
    
    alert(`✅ Tema cambiado a: ${nuevoTema}`);
  }

  /**
   * ✅ CAMBIAR IDIOMA
   */
  cambiarIdioma(nuevoIdioma: string) {
    this.idioma = nuevoIdioma;
    localStorage.setItem('idioma', nuevoIdioma);
    alert(`✅ Idioma cambiado a: ${nuevoIdioma}`);
  }

  // ===== CONFIGURACIÓN =====

  /**
   * ✅ GUARDAR CONFIGURACIÓN DE EMPRESA
   */
  guardarConfigEmpresa() {
    localStorage.setItem('empresaConfig', JSON.stringify(this.empresaConfig));
    alert('✅ Configuración guardada');
  }

  /**
   * ✅ EDITAR CONFIGURACIÓN
   */
  editarConfiguracion() {
    alert('📝 Modo edición activado - Puedes modificar los datos');
  }

  // ===== UTILIDADES =====

  /**
   * ✅ OBTENER COLOR DEL ESTADO
   */
  getEstadoBadge(estado: string): string {
    const estadoBadges: { [key: string]: string } = {
      'pendiente': 'badge-warning',
      'en_transito': 'badge-info',
      'entregada': 'badge-success',
      'incidencia': 'badge-danger',
      'cancelada': 'badge-secondary',
      'activo': 'badge-success',
      'inactivo': 'badge-secondary'
    };
    return estadoBadges[estado] || 'badge-secondary';
  }

  /**
   * ✅ OBTENER TEXTO DEL ESTADO
   */
  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'en_transito': 'En Tránsito',
      'entregada': 'Entregada',
      'incidencia': 'Incidencia',
      'cancelada': 'Cancelada',
      'activo': 'Activo',
      'inactivo': 'Inactivo'
    };
    return textos[estado] || estado;
  }

  /**
   * ✅ LOGOUT
   */
  logout() {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
    }
  }
}