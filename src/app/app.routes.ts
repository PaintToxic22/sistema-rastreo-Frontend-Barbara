import { Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin';
import { ChoferPanelComponent } from './components/chofer/entregar-encomienda/panel/panel';
import { LoginComponent } from './components/login/login';
import { OperadorPanelComponent } from './components/operador/panel/panel';
import { TrackingComponent } from './components/usuario/tracking/tracking';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  { 
    path: 'usuario/tracking',
    component: TrackingComponent,
    canActivate: [AuthGuard],
    data: { rol: ['usuario'] }
  },

  { 
    path: 'operador/encomiendas',
    component: OperadorPanelComponent,
    canActivate: [AuthGuard],
    data: { rol: ['admin', 'operador'] }
  },

  { 
    path: 'chofer/asignadas',
    component: ChoferPanelComponent,
    canActivate: [AuthGuard],
    data: { rol: ['chofer'] }
  },

  { 
    path: 'admin/dashboard',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { rol: ['admin'] }
  },

  { path: '**', redirectTo: '/login' }
];