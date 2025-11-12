import { Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin';
import { ChoferPanelComponent } from './components/chofer/entregar-encomienda/panel/panel';
import { LoginComponent } from './components/login/login';
import { OperadorPanelComponent } from './components/operador/panel/panel';
import { TrackingComponent } from './components/usuario/tracking/tracking';
import { AuthGuard } from './guards/auth.guard';

/**
 * ✅ Rutas de la aplicación
 * - Login: acceso público
 * - Tracking: solo usuarios autenticados
 * - Operador: operadores y admins
 * - Chofer: solo choferes
 * - Admin: solo administradores
 */
export const routes: Routes = [
  // ✅ Login (Público)
  { 
    path: 'login', 
    component: LoginComponent 
  },
  
  // ✅ Ruta por defecto
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  
  // ✅ Tracking de Encomiendas (Usuario)
  { 
    path: 'usuario/tracking',
    component: TrackingComponent,
    canActivate: [AuthGuard],
    data: { rol: ['usuario'] }
  },

  // ✅ Panel de Operador
  { 
    path: 'operador/encomiendas',
    component: OperadorPanelComponent,
    canActivate: [AuthGuard],
    data: { rol: ['admin', 'operador'] }
  },

  // ✅ Panel de Chofer
  { 
    path: 'chofer/asignadas',
    component: ChoferPanelComponent,
    canActivate: [AuthGuard],
    data: { rol: ['chofer'] }
  },

  // ✅ Dashboard de Admin
  { 
    path: 'admin/dashboard',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { rol: ['admin'] }
  },

  // ✅ Ruta comodín (página no encontrada)
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];