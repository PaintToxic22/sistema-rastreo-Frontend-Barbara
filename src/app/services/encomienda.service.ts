import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

export interface Encomienda {
  _id?: string;
  codigoSeguimiento: string;
  remitente: { 
    nombre: string; 
    email?: string; 
    telefono?: string; 
    ciudad?: string; 
    direccion?: string; 
  };
  destinatario: { 
    nombre: string; 
    email?: string; 
    telefono?: string; 
    ciudad?: string; 
    direccion?: string; 
  };
  valor: number;
  peso?: number;
  estado: 'pendiente' | 'asignado' | 'en_transito' | 'entregada' | 'incidencia' | 'cancelada';
  descripcion?: string;
  fechaCreacion?: Date;
  fechaEntrega?: Date;
  chofer?: any;
  porcentajeEntrega?: number;
  nombreRecibidor?: string;
  rutRecibidor?: string;
  ubicacionEntrega?: string;
}

@Injectable({ 
  providedIn: 'root' 
})
export class EncomiendaService {
  private apiUrl = 'http://localhost:3000/api';
  
  // ✅ SIGNALS (Angular 17+)
  encomiendas = signal<Encomienda[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // ✅ BEHAVIOR SUBJECTS (Compatibilidad)
  private encomiendas$ = new BehaviorSubject<Encomienda[]>([]);
  private cargando$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private encomiendasCache$: Observable<Encomienda[]> | null = null;

  constructor(private http: HttpClient) {
    console.log('📦 EncomiendaService inicializado');
  }

  /**
   * ✅ Crea una nueva encomienda manualmente
   */
  crearEncomiendaManual(datos: Partial<Encomienda>): Observable<any> {
    this.cargando.set(true);
    this.cargando$.next(true);
    console.log('📝 Creando encomienda manual...');

    // ✅ Validar datos requeridos
    if (!datos.codigoSeguimiento || datos.codigoSeguimiento.length < 10) {
      const error = 'Código debe tener mínimo 10 caracteres';
      this.error.set(error);
      this.error$.next(error);
      this.cargando.set(false);
      this.cargando$.next(false);
      return throwError(() => new Error(error));
    }

    if (!datos.valor || datos.valor < 1000) {
      const error = 'Valor mínimo: $1.000';
      this.error.set(error);
      this.error$.next(error);
      this.cargando.set(false);
      this.cargando$.next(false);
      return throwError(() => new Error(error));
    }

    const encomienda = {
      codigoSeguimiento: datos.codigoSeguimiento?.toUpperCase().trim(),
      remitente: datos.remitente,
      destinatario: datos.destinatario,
      valor: Number(datos.valor),
      peso: Number(datos.peso) || 0,
      descripcion: datos.descripcion,
      estado: 'pendiente',
      porcentajeEntrega: 0,
      fechaCreacion: new Date()
    };

    return this.http.post<any>(`${this.apiUrl}/encomiendas/crear-manual`, encomienda).pipe(
      tap(response => {
        console.log('✅ Encomienda creada:', response);
        this.encomiendasCache$ = null; // Limpiar cache
        
        // ✅ ASIGNAR CHOFER AUTOMÁTICAMENTE
        if (response.encomienda?._id) {
          this.asignarChofersAutomaticamente(response.encomienda._id);
        }
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        const message = err.error?.message || 'Error al crear encomienda';
        this.error.set(message);
        this.error$.next(message);
        return throwError(() => err);
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );
  }

  /**
   * ✅ Asignar chofer automáticamente
   */
  private asignarChofersAutomaticamente(encomiendaId: string) {
    console.log('🚗 Asignando chofer automáticamente...');
    
    this.http.post<any>(`${this.apiUrl}/encomiendas/${encomiendaId}/asignar-chofer`, {})
      .subscribe({
        next: (response) => {
          console.log('✅ Chofer asignado:', response.chofer?.nombre);
        },
        error: (err) => {
          console.warn('⚠️ No hay choferes disponibles:', err);
        }
      });
  }

  /**
   * ✅ Obtiene encomiendas asignadas a un chofer
   */
  obtenerAsignadas(choferId: string): Observable<Encomienda[]> {
    console.log('📍 Obteniendo asignadas para chofer:', choferId);
    
    return this.http.get<any>(`${this.apiUrl}/encomiendas/asignadas/${choferId}`).pipe(
      map(response => Array.isArray(response) ? response : response.encomiendas || []),
      tap(encomiendas => console.log('✅ Encomiendas asignadas:', encomiendas.length)),
      catchError(err => {
        console.error('❌ Error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Confirmar entrega (chofer ingresa nombre y RUT opcional)
   */
  confirmarEntrega(encomiendaId: string, datos: {
    nombreRecibidor: string;
    rutRecibidor?: string;
    ubicacionEntrega?: string;
  }): Observable<any> {
    console.log('✅ Confirmando entrega:', datos);

    // ✅ Validar nombre (requerido)
    if (!datos.nombreRecibidor || datos.nombreRecibidor.trim().length < 3) {
      const error = 'Nombre de recibidor requerido';
      return throwError(() => new Error(error));
    }

    return this.http.put<any>(
      `${this.apiUrl}/encomiendas/${encomiendaId}/confirmar-entrega`,
      datos
    ).pipe(
      tap(response => {
        console.log('✅ Entrega confirmada:', response);
        this.encomiendasCache$ = null; // Limpiar cache
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Rastrear encomienda por código
   */
  rastrearPorCodigo(codigo: string): Observable<any> {
    console.log('🔍 Rastreando código:', codigo);
    
    return this.http.get<any>(`${this.apiUrl}/encomiendas/rastrear/${codigo}`).pipe(
      tap(response => console.log('✅ Encontrada:', response)),
      catchError(err => {
        console.error('❌ Error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Obtener todas las encomiendas
   */
  obtenerTodas(): Observable<Encomienda[]> {
    return this.http.get<any>(`${this.apiUrl}/encomiendas`).pipe(
      map(response => response.encomiendas || response),
      tap(encomiendas => console.log('✅ Encomiendas obtenidas:', encomiendas.length))
    );
  }

  /**
   * ✅ Obtener encomienda por ID
   */
  obtenerPorId(id: string): Observable<Encomienda> {
    return this.http.get<any>(`${this.apiUrl}/encomiendas/${id}`).pipe(
      map(response => response.encomienda || response),
      tap(encomienda => console.log('✅ Encomienda:', encomienda))
    );
  }

  /**
   * ✅ Actualizar estado
   */
  actualizarEstado(id: string, estado: string): Observable<Encomienda> {
    return this.http.patch<any>(`${this.apiUrl}/encomiendas/${id}/estado`, { estado }).pipe(
      map(response => response.encomienda || response),
      tap(() => {
        this.encomiendasCache$ = null; // Limpiar cache
      })
    );
  }

  /**
   * ✅ Marcar como entregada
   */
  marcarEntregada(id: string, datos: any): Observable<any> {
    console.log('✅ Marcando como entregada:', id);

    return this.http.put<any>(`${this.apiUrl}/encomiendas/${id}/confirmar-entrega`, datos).pipe(
      tap(response => {
        console.log('✅ Confirmada:', response);
        this.encomiendasCache$ = null;
      }),
      catchError(err => {
        console.error('❌ Error:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * ✅ Obtener encomiendas por estado
   */
  obtenerPorEstado(estado: string): Observable<Encomienda[]> {
    return this.http.get<any>(`${this.apiUrl}/encomiendas?estado=${estado}`).pipe(
      map(response => response.encomiendas || [])
    );
  }

  /**
   * ✅ Obtener encomiendas de un chofer
   */
  obtenerEncomiendasChofer(choferId: string): Observable<Encomienda[]> {
    console.log('🚗 Del chofer:', choferId);
    return this.http.get<{ encomiendas: Encomienda[] }>(
      `${this.apiUrl}/encomiendas/chofer/${choferId}`
    ).pipe(
      map(response => response.encomiendas),
      tap(encomiendas => console.log('✅ Obtenidas:', encomiendas.length)),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * ✅ Limpiar error
   */
  limpiarError(): void {
    this.error.set(null);
    this.error$.next(null);
  }
}