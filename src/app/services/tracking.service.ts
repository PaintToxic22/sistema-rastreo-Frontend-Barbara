import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, interval, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

export interface EventoSeguimiento {
  _id?: string;
  estado: string;
  fecha: Date;
  descripcion: string;
  ubicacion?: string;
  nombreRecibidor?: string;
  foto?: string;
}

export interface RastreoCompleto {
  encomienda: any;
  historial: EventoSeguimiento[];
  porcentajeEntrega: number;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private apiUrl = 'http://localhost:3000/api/tracking';
  
  // ✅ SIGNALS (Angular 17+)
  rastreo = signal<RastreoCompleto | null>(null);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);
  actualizando = signal<boolean>(false);
  
  // ✅ BEHAVIOR SUBJECTS (Compatibilidad)
  private rastreo$ = new BehaviorSubject<RastreoCompleto | null>(null);
  private cargando$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<string | null>(null);
  private actualizando$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {
    console.log('🔍 TrackingService inicializado');
  }

  /**
   * ✅ Rastrea una encomienda por código de seguimiento
   */
  rastrearPorCodigo(codigo: string): Observable<RastreoCompleto> {
    this.cargando.set(true);
    this.cargando$.next(true);
    this.error.set(null);
    this.error$.next(null);
    
    console.log('🔍 Rastreando código:', codigo);

    return this.http.get<RastreoCompleto>(`${this.apiUrl}/${codigo}`)
      .pipe(
        tap(rastreo => {
          console.log('✅ Rastreo encontrado:', rastreo);
          this.rastreo.set(rastreo);
          this.rastreo$.next(rastreo);
        }),
        catchError(error => {
          console.error('❌ Error rastreando:', error);
          const mensaje = 'Código de seguimiento no encontrado';
          this.error.set(mensaje);
          this.error$.next(mensaje);
          alert(`❌ ${mensaje}`);
          return throwError(() => error);
        }),
        finalize(() => {
          this.cargando.set(false);
          this.cargando$.next(false);
        })
      );
  }

  /**
   * ✅ Rastrea por ID de encomienda
   */
  rastrearPorId(encomiendaId: string): Observable<RastreoCompleto> {
    console.log('🔍 Rastreando por ID:', encomiendaId);

    return this.http.get<RastreoCompleto>(`${this.apiUrl}/id/${encomiendaId}`)
      .pipe(
        tap(rastreo => {
          console.log('✅ Rastreo obtenido');
          this.rastreo.set(rastreo);
          this.rastreo$.next(rastreo);
        }),
        catchError(error => {
          console.error('❌ Error en tracking:', error);
          const mensaje = 'Error al obtener rastreo';
          this.error.set(mensaje);
          this.error$.next(mensaje);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Obtiene rastreo como observable
   */
  getRastreo$(): Observable<RastreoCompleto | null> {
    return this.rastreo$.asObservable();
  }

  /**
   * ✅ Obtiene estado de carga
   */
  getCargando$(): Observable<boolean> {
    return this.cargando$.asObservable();
  }

  /**
   * ✅ Obtiene errores
   */
  getError$(): Observable<string | null> {
    return this.error$.asObservable();
  }

  /**
   * ✅ Obtiene si está actualizando automáticamente
   */
  getActualizando$(): Observable<boolean> {
    return this.actualizando$.asObservable();
  }

  /**
   * ✅ Actualiza rastreo automáticamente cada 30 segundos
   */
  actualizarAutomatico(codigo: string): Observable<RastreoCompleto> {
    console.log('⏱️ Configurando actualización automática:', codigo);
    this.actualizando.set(true);
    this.actualizando$.next(true);

    return interval(30000).pipe(
      startWith(0), // Ejecutar inmediatamente la primera vez
      switchMap(() => this.rastrearPorCodigo(codigo)),
      finalize(() => {
        this.actualizando.set(false);
        this.actualizando$.next(false);
      }),
      shareReplay(1)
    );
  }

  /**
   * ✅ Obtiene historial de eventos
   */
  obtenerHistorial(encomiendaId: string): Observable<EventoSeguimiento[]> {
    console.log('📜 Obteniendo historial:', encomiendaId);

    return this.http.get<{ eventos: EventoSeguimiento[] }>(
      `${this.apiUrl}/${encomiendaId}/historial`
    ).pipe(
      map(response => response.eventos),
      tap(eventos => {
        console.log('✅ Historial obtenido:', eventos.length);
      }),
      catchError(error => {
        console.error('❌ Error obteniendo historial:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ Registra un evento de seguimiento
   */
  registrarEvento(encomiendaId: string, evento: EventoSeguimiento): Observable<EventoSeguimiento> {
    this.cargando.set(true);
    this.cargando$.next(true);
    console.log('📝 Registrando evento:', evento.estado);

    return this.http.post<EventoSeguimiento>(
      `${this.apiUrl}/${encomiendaId}/evento`,
      evento
    ).pipe(
      tap(eventoCreado => {
        console.log('✅ Evento registrado:', eventoCreado);
        alert('✅ Evento registrado exitosamente');
      }),
      catchError(error => {
        console.error('❌ Error registrando evento:', error);
        const mensaje = error.error?.message || 'Error al registrar evento';
        this.error.set(mensaje);
        this.error$.next(mensaje);
        alert(`❌ ${mensaje}`);
        return throwError(() => error);
      }),
      finalize(() => {
        this.cargando.set(false);
        this.cargando$.next(false);
      })
    );
  }

  /**
   * ✅ Obtiene estadísticas de rastreo
   */
  obtenerEstadisticas(): Observable<any> {
    console.log('📊 Obteniendo estadísticas');

    return this.http.get(`${this.apiUrl}/estadisticas`)
      .pipe(
        tap(stats => {
          console.log('✅ Estadísticas obtenidas:', stats);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo estadísticas:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Obtiene detalles completos de rastreo
   */
  obtenerDetalles(codigo: string): Observable<any> {
    console.log('📋 Obteniendo detalles de:', codigo);

    return this.http.get(`${this.apiUrl}/detalles/${codigo}`)
      .pipe(
        tap(detalles => {
          console.log('✅ Detalles obtenidos:', detalles);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo detalles:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Obtiene encomiendas del usuario actual
   */
  obtenerMisEncomiendas(): Observable<any> {
    console.log('📦 Obteniendo mis encomiendas');

    return this.http.get(`${this.apiUrl}/usuario/mis-encomiendas`)
      .pipe(
        tap(encomiendas => {
          console.log('✅ Encomiendas obtenidas:', encomiendas);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo encomiendas:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Obtiene estadísticas globales del sistema
   */
  obtenerEstadisticasGlobales(): Observable<any> {
    console.log('📊 Obteniendo estadísticas globales');

    return this.http.get(`${this.apiUrl}/stats/globales`)
      .pipe(
        tap(stats => {
          console.log('✅ Estadísticas globales obtenidas:', stats);
        }),
        catchError(error => {
          console.error('❌ Error obteniendo estadísticas globales:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Obtiene encomiendas filtradas por criterios
   */
  obtenerFiltrando(filtros: any): Observable<any> {
    console.log('🔎 Filtrando encomiendas:', filtros);

    let params = new HttpParams();
    Object.keys(filtros).forEach(key => {
      if (filtros[key]) {
        params = params.set(key, filtros[key]);
      }
    });

    return this.http.get(`${this.apiUrl}/filtro`, { params })
      .pipe(
        tap(response => {
          console.log('✅ Filtrado completado');
        }),
        catchError(error => {
          console.error('❌ Error filtrando:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Limpia errores
   */
  limpiarError(): void {
    this.error.set(null);
    this.error$.next(null);
  }

  /**
   * ✅ Limpia rastreo
   */
  limpiarRastreo(): void {
    this.rastreo.set(null);
    this.rastreo$.next(null);
  }
}