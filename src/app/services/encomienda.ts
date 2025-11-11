import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EncomiendaService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  obtenerEncomiendas(): Observable<any> {
    console.log('📦 Obteniendo encomiendas...');
    
    return this.http.get<any>(`${this.apiUrl}/encomiendas`).pipe(
      catchError((error) => {
        console.warn('⚠️ Error obteniendo del servidor, usando datos de prueba');
        return of(this.obtenerDatosPrueba());
      })
    );
  }

  obtenerEncomiendaPorId(id: string): Observable<any> {
    console.log('📦 Obteniendo encomienda por ID:', id);
    
    return this.http.get<any>(`${this.apiUrl}/encomiendas/${id}`).pipe(
      catchError((error) => {
        console.warn('⚠️ Error obteniendo encomienda, buscando en datos locales');
        const datosprueba = this.obtenerDatosPrueba();
        const encomienda = datosprueba.encomiendas.find((e: any) => e.id === id);
        return of({ success: true, encomienda: encomienda || null });
      })
    );
  }

  crearEncomienda(datos: any): Observable<any> {
    console.log('✏️ Creando encomienda:', datos);
    
    return this.http.post<any>(`${this.apiUrl}/encomiendas`, datos).pipe(
      catchError((error) => {
        console.warn('⚠️ Error creando encomienda, simulando respuesta');
        return of({
          success: true,
          mensaje: 'Encomienda creada exitosamente (simulado)',
          encomienda: { 
            ...datos, 
            id: Math.random().toString(), 
            codigoSeguimiento: 'LQE' + Math.floor(Math.random() * 99999),
            estado: 'pendiente'
          }
        });
      })
    );
  }

  marcarEntregada(id: string, datos: any): Observable<any> {
    console.log('✅ Marcando como entregada:', id, datos);
    
    return this.http.put<any>(`${this.apiUrl}/encomiendas/${id}/entregar`, datos).pipe(
      catchError((error) => {
        console.warn('⚠️ Error marcando entrega, simulando respuesta');
        return of({
          success: true,
          mensaje: 'Entrega confirmada (simulado)'
        });
      })
    );
  }

  private obtenerDatosPrueba(): any {
    return {
      success: true,
      encomiendas: [
        {
          id: '1',
          codigoSeguimiento: 'LQE001',
          remitente: { 
            nombre: 'Juan Pérez', 
            ciudad: 'Santiago', 
            direccion: 'Calle 1 #100',
            telefono: '+56912345678'
          },
          destinatario: { 
            nombre: 'Carlos López', 
            ciudad: 'Valparaíso', 
            direccion: 'Avenida 2 #200',
            telefono: '+56987654321'
          },
          descripcion: 'Paquete de documentos',
          peso: 2.5,
          valor: 50000,
          estado: 'en_transito',
          fechaCreacion: '2025-11-08',
          fechaEntrega: null
        },
        {
          id: '2',
          codigoSeguimiento: 'LQE002',
          remitente: { 
            nombre: 'Ana García', 
            ciudad: 'Santiago', 
            direccion: 'Calle 3 #300',
            telefono: '+56911111111'
          },
          destinatario: { 
            nombre: 'Roberto Silva', 
            ciudad: 'Concepción', 
            direccion: 'Avenida 4 #400',
            telefono: '+56922222222'
          },
          descripcion: 'Electrónica',
          peso: 1.5,
          valor: 75000,
          estado: 'entregado',
          fechaCreacion: '2025-11-05',
          fechaEntrega: '2025-11-09'
        },
        {
          id: '3',
          codigoSeguimiento: 'LQE003',
          remitente: { 
            nombre: 'María Rodríguez', 
            ciudad: 'Valparaíso', 
            direccion: 'Calle 5 #500',
            telefono: '+56933333333'
          },
          destinatario: { 
            nombre: 'Diego Fernández', 
            ciudad: 'Temuco', 
            direccion: 'Avenida 6 #600',
            telefono: '+56944444444'
          },
          descripcion: 'Ropa y accesorios',
          peso: 3.0,
          valor: 100000,
          estado: 'pendiente',
          fechaCreacion: '2025-11-09',
          fechaEntrega: null
        },
        {
          id: '4',
          codigoSeguimiento: 'LQE004',
          remitente: { 
            nombre: 'Patricia Martínez', 
            ciudad: 'Concepción', 
            direccion: 'Calle 7 #700',
            telefono: '+56955555555'
          },
          destinatario: { 
            nombre: 'Felipe González', 
            ciudad: 'Puerto Montt', 
            direccion: 'Avenida 8 #800',
            telefono: '+56966666666'
          },
          descripcion: 'Libros y material educativo',
          peso: 5.0,
          valor: 45000,
          estado: 'en_transito',
          fechaCreacion: '2025-11-07',
          fechaEntrega: null
        },
        {
          id: '5',
          codigoSeguimiento: 'LQE005',
          remitente: { 
            nombre: 'Luis Torres', 
            ciudad: 'Temuco', 
            direccion: 'Calle 9 #900',
            telefono: '+56977777777'
          },
          destinatario: { 
            nombre: 'Gabriela Sánchez', 
            ciudad: 'Punta Arenas', 
            direccion: 'Avenida 10 #1000',
            telefono: '+56988888888'
          },
          descripcion: 'Equipamiento deportivo',
          peso: 8.0,
          valor: 120000,
          estado: 'entregado',
          fechaCreacion: '2025-11-01',
          fechaEntrega: '2025-11-06'
        },
        {
          id: '6',
          codigoSeguimiento: 'LQE006',
          remitente: { 
            nombre: 'Carlos Mendez', 
            ciudad: 'Santiago', 
            direccion: 'Calle 11 #1100',
            telefono: '+56999999999'
          },
          destinatario: { 
            nombre: 'Sofía Ramírez', 
            ciudad: 'Valdivia', 
            direccion: 'Avenida 12 #1200',
            telefono: '+56912121212'
          },
          descripcion: 'Muebles',
          peso: 15.0,
          valor: 250000,
          estado: 'en_transito',
          fechaCreacion: '2025-11-08',
          fechaEntrega: null
        },
        {
          id: '7',
          codigoSeguimiento: 'LQE007',
          remitente: { 
            nombre: 'Elena Vargas', 
            ciudad: 'Viña del Mar', 
            direccion: 'Calle 13 #1300',
            telefono: '+56913131313'
          },
          destinatario: { 
            nombre: 'Andrés Castillo', 
            ciudad: 'Los Angeles', 
            direccion: 'Avenida 14 #1400',
            telefono: '+56914141414'
          },
          descripcion: 'Artículos de oficina',
          peso: 2.0,
          valor: 35000,
          estado: 'entregado',
          fechaCreacion: '2025-10-28',
          fechaEntrega: '2025-11-03'
        }
      ]
    };
  }
}