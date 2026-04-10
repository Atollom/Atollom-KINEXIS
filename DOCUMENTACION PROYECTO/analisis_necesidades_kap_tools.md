# ANÁLISIS EXHAUSTIVO: NECESIDADES KAP TOOLS → AGENTES ATOLLOM NEXUS

## CANAL 1: MERCADO LIBRE

### Necesidad: "Crear publicaciones optimizadas (títulos, descripciones, SEO, imágenes)"

**Agente responsable: ML Listing Optimizer Agent (NUEVO)**

```python
class MLListingOptimizerAgent:
    """
    Agente especializado en optimización de publicaciones en Mercado Libre
    """
    
    async def optimize_listing(self, product_id: str, tenant_id: str):
        # 1. Analizar competencia (títulos, precios, keywords)
        competitors = await self.analyze_competitors(product_id)
        
        # 2. Generar título SEO-optimizado (60 chars max ML)
        title = await self.generate_seo_title(
            product=product,
            competitors=competitors,
            trending_keywords=await self.get_trending_keywords()
        )
        
        # 3. Generar descripción persuasiva con bullet points
        description = await self.generate_description(
            product=product,
            best_practices=ML_DESCRIPTION_TEMPLATE
        )
        
        # 4. Optimizar imágenes (orden, calidad, watermarks)
        images = await self.optimize_images(product.images)
        
        # 5. Seleccionar categoría óptima y atributos
        category = await self.select_best_category(product)
        
        # 6. Determinar tipo de publicación (clásica vs premium)
        listing_type = self.determine_listing_type(
            product_margin=product.margin,
            competition_level=competitors.level
        )
        
        return OptimizedListing(
            title=title,
            description=description,
            images=images,
            category=category,
            listing_type=listing_type
        )
```

**Funcionalidades clave**:
- Análisis de competencia en tiempo real
- Keywords trending en la categoría
- Optimización de imágenes (redimensión, watermark, orden)
- A/B testing de títulos (si tenant lo habilita)
- Sugerencias de mejora continua basadas en métricas

---

### Necesidad: "Gestionar campañas de publicidad (ADS)"

**Agente responsable: ML Ads Manager Agent (NUEVO)**

```python
class MLAdsManagerAgent:
    """
    Gestión completa de campañas publicitarias en Mercado Libre
    """
    
    async def create_campaign(
        self,
        product_ids: list[str],
        budget: float,
        duration_days: int,
        tenant_id: str
    ):
        # 1. Analizar productos candidatos para ADS
        candidates = await self.analyze_ad_candidates(product_ids)
        
        # 2. Calcular CPC/CPM óptimo basado en competencia
        bid_strategy = await self.calculate_optimal_bid(
            category=candidates[0].category,
            competition=await self.get_competition_level()
        )
        
        # 3. Crear campaña en ML Ads API
        campaign = await self.ml_adapter.create_ad_campaign(
            products=candidates,
            budget_per_day=budget / duration_days,
            bid_strategy=bid_strategy
        )
        
        # 4. Configurar segmentación (ubicación, edad, intereses)
        targeting = self.build_targeting(
            tenant_config=await self.get_tenant_config(tenant_id),
            product_category=candidates[0].category
        )
        
        # 5. Programar reportes automáticos
        await self.schedule_daily_reports(campaign.id, tenant_id)
        
        return campaign
    
    async def optimize_campaign(self, campaign_id: str):
        """
        Optimización diaria de campaña existente
        """
        # 1. Obtener métricas de ayer
        metrics = await self.ml_adapter.get_campaign_metrics(campaign_id)
        
        # 2. Detectar productos con bajo rendimiento
        underperforming = [
            p for p in metrics.products 
            if p.ctr < 0.02 or p.conversion_rate < 0.01
        ]
        
        # 3. Ajustar pujas (aumentar bien performers, bajar mal performers)
        for product in metrics.products:
            new_bid = self.calculate_bid_adjustment(
                current_bid=product.bid,
                ctr=product.ctr,
                conversion_rate=product.conversion_rate,
                roas=product.roas
            )
            await self.ml_adapter.update_product_bid(product.id, new_bid)
        
        # 4. Pausar productos con ROAS < 1.0 después de 3 días
        if metrics.days_running >= 3:
            for product in underperforming:
                if product.roas < 1.0:
                    await self.ml_adapter.pause_product(product.id)
                    await self.notify_admin(
                        f"Producto {product.sku} pausado: ROAS {product.roas}"
                    )
```

**Funcionalidades clave**:
- Creación de campañas con segmentación avanzada
- Optimización automática diaria de pujas
- Detección de productos underperforming
- Reportes automáticos de ROAS, CTR, conversiones
- Alertas cuando presupuesto se agota o ROAS cae

---

### Necesidad: "Revisar métricas y ajustar estrategias"

**Agente responsable: ML Analytics Agent (NUEVO)**

```python
class MLAnalyticsAgent:
    """
    Análisis profundo de métricas de Mercado Libre
    """
    
    async def generate_weekly_report(self, tenant_id: str):
        """
        Reporte semanal automático con insights accionables
        """
        # 1. Métricas de ventas
        sales_metrics = await self.ml_adapter.get_sales_metrics(days=7)
        
        # 2. Métricas de tráfico y conversión
        traffic_metrics = await self.ml_adapter.get_traffic_metrics(days=7)
        
        # 3. Análisis de preguntas (cantidad, tiempo respuesta, conversión)
        questions_analysis = await self.analyze_questions_funnel()
        
        # 4. Análisis de competencia (cambios de precios, nuevos entrantes)
        competitor_changes = await self.track_competitor_changes()
        
        # 5. Productos que necesitan atención
        action_items = self.identify_action_items(
            sales=sales_metrics,
            traffic=traffic_metrics,
            questions=questions_analysis
        )
        
        # 6. Generar recomendaciones estratégicas
        recommendations = await self.generate_recommendations(
            metrics=sales_metrics,
            market_trends=competitor_changes,
            action_items=action_items
        )
        
        # 7. Enviar reporte a admin
        await self.send_report(
            tenant_id=tenant_id,
            report=WeeklyReport(
                sales=sales_metrics,
                traffic=traffic_metrics,
                questions=questions_analysis,
                recommendations=recommendations,
                action_items=action_items
            )
        )
    
    def identify_action_items(self, sales, traffic, questions):
        """
        Identifica productos/situaciones que requieren acción humana
        """
        items = []
        
        # Productos con alto tráfico pero baja conversión
        for product in traffic.products:
            if product.visits > 100 and product.conversion_rate < 0.02:
                items.append(ActionItem(
                    priority="HIGH",
                    product_sku=product.sku,
                    issue="Alto tráfico (100+ visitas) pero conversión baja (2%)",
                    suggested_action="Revisar precio, imágenes o descripción"
                ))
        
        # Productos con preguntas sin responder
        for product in questions.products:
            if product.unanswered_questions > 3:
                items.append(ActionItem(
                    priority="URGENT",
                    product_sku=product.sku,
                    issue=f"{product.unanswered_questions} preguntas sin responder",
                    suggested_action="Responder preguntas manualmente o ajustar IA"
                ))
        
        # Productos sin ventas en 30 días
        for product in sales.products:
            if product.days_without_sale > 30 and product.stock > 0:
                items.append(ActionItem(
                    priority="MEDIUM",
                    product_sku=product.sku,
                    issue="30+ días sin ventas",
                    suggested_action="Considerar descuento o publicidad"
                ))
        
        return items
```

**Funcionalidades clave**:
- Reportes semanales automáticos
- Identificación de productos problemáticos
- Análisis de competencia
- Recomendaciones accionables (no solo datos)
- Alertas proactivas de problemas

---

### Necesidad: "Generar envíos (Full, FBA, guías, citas)"

**Agente responsable: ML Fulfillment Agent (NUEVO)**

```python
class MLFulfillmentAgent:
    """
    Gestión completa de logística y fulfillment de Mercado Libre
    """
    
    async def process_order_fulfillment(self, order_id: str, tenant_id: str):
        """
        Procesa el fulfillment de una orden según su tipo
        """
        order = await self.get_order(order_id)
        
        # Determinar tipo de fulfillment
        if order.shipping.mode == "me2":
            # Mercado Envíos Full
            return await self.process_ml_full(order)
        elif order.shipping.mode == "custom":
            # Envío propio - generar guía
            return await self.process_custom_shipping(order, tenant_id)
        else:
            # Retiro en persona
            return await self.process_pickup(order)
    
    async def process_ml_full(self, order):
        """
        Proceso para órdenes ML Full
        """
        # 1. Crear orden de preparación en sistema
        prep_order = await self.create_prep_order(
            order_id=order.id,
            warehouse_id=order.warehouse_assigned,
            items=order.items,
            deadline=order.shipping.deadline
        )
        
        # 2. Generar etiqueta de ML Full
        label = await self.ml_adapter.generate_full_label(order.id)
        
        # 3. Guardar PDF de etiqueta
        await self.store_label(label.pdf_url, order.id)
        
        # 4. Notificar al almacenista
        await self.notify_warehouse(
            warehouse_id=order.warehouse_assigned,
            message=f"Nueva orden ML Full #{order.platform_order_id}",
            priority="NORMAL" if order.shipping.time_left_hours > 24 else "URGENT"
        )
        
        # 5. Crear tarea en sistema
        return PrepTask(
            order_id=order.id,
            type="ml_full",
            label_url=label.pdf_url,
            deadline=order.shipping.deadline,
            status="pending_prep"
        )
    
    async def process_custom_shipping(self, order, tenant_id):
        """
        Generar guía de paquetería externa
        """
        # 1. Determinar paquetería según configuración del tenant
        tenant_config = await self.get_tenant_config(tenant_id)
        carrier = self.select_carrier(
            destination=order.shipping.address,
            weight=order.total_weight,
            preferred_carriers=tenant_config.preferred_carriers
        )
        
        # 2. Generar cotización
        quote = await self.carrier_adapter.get_quote(
            carrier=carrier,
            origin=tenant_config.default_warehouse_address,
            destination=order.shipping.address,
            weight=order.total_weight,
            dimensions=order.total_dimensions
        )
        
        # 3. Si está dentro de presupuesto, generar guía
        if quote.price <= tenant_config.max_shipping_cost:
            guide = await self.carrier_adapter.create_shipment(
                carrier=carrier,
                quote_id=quote.id,
                order=order
            )
            
            # 4. Guardar PDF de guía
            await self.store_label(guide.pdf_url, order.id)
            
            # 5. Actualizar tracking en ML
            await self.ml_adapter.update_tracking(
                order_id=order.id,
                carrier=carrier,
                tracking_number=guide.tracking_number
            )
            
            return PrepTask(
                order_id=order.id,
                type="custom_shipping",
                carrier=carrier,
                label_url=guide.pdf_url,
                tracking_number=guide.tracking_number,
                status="pending_prep"
            )
        else:
            # Precio muy alto - escalar a humano
            await self.request_approval(
                order_id=order.id,
                reason=f"Costo envío ${quote.price} excede máximo ${tenant_config.max_shipping_cost}",
                quote=quote
            )
    
    async def schedule_pickup(self, shipment_id: str, tenant_id: str):
        """
        Agendar recolección con paquetería
        """
        shipment = await self.get_shipment(shipment_id)
        tenant_config = await self.get_tenant_config(tenant_id)
        
        # Agendar recolección
        pickup = await self.carrier_adapter.schedule_pickup(
            carrier=shipment.carrier,
            address=tenant_config.default_warehouse_address,
            date=self.get_next_pickup_date(shipment.carrier),
            time_window="9:00-18:00",
            packages_count=1
        )
        
        # Notificar al almacén
        await self.notify_warehouse(
            warehouse_id=tenant_config.default_warehouse_id,
            message=f"Recolección programada: {pickup.date} {pickup.time_window}"
        )
        
        return pickup
```

**Funcionalidades clave**:
- Generación automática de etiquetas ML Full
- Integración con paqueterías (Estafeta, DHL, FedEx, etc.)
- Cotización y selección automática de paquetería
- Agendamiento de recolecciones
- Dashboard para almacenista con etiquetas listas para imprimir

---

## CANAL 2: AMAZON

### Necesidad: "Crear publicaciones optimizadas + ADS"

**Agentes responsables:**
1. **Amazon Listing Optimizer Agent** (similar a ML pero con reglas de Amazon)
2. **Amazon Ads Manager Agent** (PPC campaigns, Sponsored Products/Brands/Display)

```python
class AmazonAdsManagerAgent:
    """
    Gestión de campañas Amazon Advertising
    """
    
    async def create_sponsored_products_campaign(
        self,
        asin_list: list[str],
        budget_daily: float,
        tenant_id: str
    ):
        # 1. Investigación de keywords con alto volumen y baja competencia
        keywords = await self.amazon_ads_api.keyword_research(
            asins=asin_list,
            match_type="broad"  # broad, phrase, exact
        )
        
        # 2. Calcular CPC sugerido por keyword
        bids = await self.calculate_optimal_bids(keywords)
        
        # 3. Crear campaña
        campaign = await self.amazon_ads_api.create_campaign(
            name=f"Auto_{datetime.now().strftime('%Y%m%d')}",
            budget_daily=budget_daily,
            targeting="manual",  # manual vs auto
            bidding_strategy="dynamic_down"  # down-only optimization
        )
        
        # 4. Agregar ad groups y keywords
        for keyword in keywords:
            await self.amazon_ads_api.add_keyword(
                campaign_id=campaign.id,
                keyword=keyword.text,
                match_type=keyword.match_type,
                bid=bids[keyword.text]
            )
        
        # 5. Configurar negative keywords (para evitar clics irrelevantes)
        negative_keywords = await self.get_negative_keywords(tenant_id)
        for neg_kw in negative_keywords:
            await self.amazon_ads_api.add_negative_keyword(
                campaign_id=campaign.id,
                keyword=neg_kw
            )
        
        return campaign
    
    async def optimize_sponsored_products(self, campaign_id: str):
        """
        Optimización diaria de Sponsored Products
        """
        # 1. Obtener métricas de últimos 7 días
        metrics = await self.amazon_ads_api.get_campaign_report(
            campaign_id=campaign_id,
            days=7
        )
        
        # 2. Identificar keywords con bajo CTR o alto ACoS
        for keyword in metrics.keywords:
            # ACoS = Ad Spend / Sales * 100
            if keyword.acos > 30:  # ACoS > 30% es malo
                # Reducir puja
                new_bid = keyword.bid * 0.8
                await self.amazon_ads_api.update_keyword_bid(
                    keyword.id, 
                    max(new_bid, 0.30)  # Mínimo $0.30
                )
            elif keyword.acos < 15 and keyword.ctr > 0.5:
                # Excelente performer - aumentar puja
                new_bid = keyword.bid * 1.15
                await self.amazon_ads_api.update_keyword_bid(
                    keyword.id,
                    min(new_bid, 3.00)  # Máximo $3.00
                )
        
        # 3. Pausar keywords sin ventas después de 100+ clics
        for keyword in metrics.keywords:
            if keyword.clicks > 100 and keyword.sales == 0:
                await self.amazon_ads_api.pause_keyword(keyword.id)
                await self.notify_admin(
                    f"Keyword '{keyword.text}' pausada: 100+ clics sin ventas"
                )
```

**Funcionalidades clave Amazon ADS**:
- Sponsored Products (keywords targeting)
- Sponsored Brands (banner ads)
- Sponsored Display (retargeting)
- Investigación de keywords automática
- Optimización de pujas basada en ACoS
- Reportes detallados de rendimiento

---

### Necesidad: "Gestionar FBA y FBM"

**Agente responsable: Amazon FBA/FBM Manager Agent (NUEVO)**

```python
class AmazonFBAManagerAgent:
    """
    Gestión completa de Amazon FBA (Fulfillment by Amazon)
    """
    
    async def create_fba_shipment(
        self,
        product_id: str,
        quantity: int,
        tenant_id: str
    ):
        """
        Crea un envío a FBA desde el almacén de Kap Tools a Amazon
        """
        # 1. Verificar que el producto está registrado en FBA
        product = await self.get_product(product_id)
        if not product.amazon_fba_enabled:
            raise ValueError("Producto no está habilitado para FBA")
        
        # 2. Crear plan de envío en Amazon
        shipment_plan = await self.amazon_sp_api.create_inbound_shipment_plan(
            address=await self.get_warehouse_address(tenant_id),
            items=[{
                "sku": product.sku,
                "quantity": quantity,
                "prep_details": product.fba_prep_requirements
            }]
        )
        
        # 3. Etiquetar productos (si Amazon lo requiere)
        if shipment_plan.requires_labels:
            labels = await self.amazon_sp_api.get_product_labels(
                shipment_id=shipment_plan.id
            )
            await self.store_labels(labels, product_id)
        
        # 4. Crear envío con transportista
        carrier_quote = await self.get_carrier_quote(
            destination=shipment_plan.destination_fc,
            weight=quantity * product.weight_kg,
            dimensions=self.calculate_box_dimensions(quantity, product)
        )
        
        shipment = await self.create_shipment(
            carrier=carrier_quote.carrier,
            tracking_number=carrier_quote.tracking_number
        )
        
        # 5. Confirmar shipment en Amazon
        await self.amazon_sp_api.confirm_inbound_shipment(
            shipment_id=shipment_plan.id,
            carrier=carrier_quote.carrier,
            tracking_number=carrier_quote.tracking_number
        )
        
        # 6. Notificar al almacenista
        await self.notify_warehouse(
            tenant_id=tenant_id,
            message=f"Preparar envío FBA: {quantity}x {product.name}",
            labels_url=labels.pdf_url if shipment_plan.requires_labels else None,
            deadline=shipment_plan.deadline
        )
        
        return FBAShipment(
            shipment_id=shipment_plan.id,
            destination_fc=shipment_plan.destination_fc,
            quantity=quantity,
            labels_url=labels.pdf_url if shipment_plan.requires_labels else None,
            tracking_number=carrier_quote.tracking_number
        )
    
    async def monitor_fba_inventory(self, tenant_id: str):
        """
        Monitoreo diario de inventario FBA
        """
        # 1. Obtener inventario actual en FBA
        fba_inventory = await self.amazon_sp_api.get_fba_inventory()
        
        # 2. Comparar con niveles mínimos configurados
        low_stock_items = []
        for item in fba_inventory:
            product = await self.get_product_by_sku(item.sku)
            if item.quantity < product.fba_reorder_point:
                low_stock_items.append(item)
        
        # 3. Generar alertas y sugerencias de reorden
        if low_stock_items:
            for item in low_stock_items:
                # Calcular cantidad sugerida de reorden
                suggested_qty = await self.calculate_reorder_quantity(
                    sku=item.sku,
                    current_stock=item.quantity,
                    sales_velocity=item.sales_last_30_days / 30
                )
                
                await self.notify_admin(
                    f"Stock bajo FBA: {item.sku}",
                    current=item.quantity,
                    suggested_reorder=suggested_qty,
                    action="create_fba_shipment"
                )
```

**Funcionalidades clave FBA**:
- Creación de envíos inbound a FBA
- Monitoreo de inventario en centros de Amazon
- Alertas de stock bajo
- Sugerencias automáticas de reorden
- Gestión de etiquetas FNSKU

---

## RESPONSABILIDADES ADICIONALES DEL CLIENTE

### "Ventas directas + Cotizaciones"

**Agente responsable: Sales Agent B2B (YA ESTÁ EN v1.0)**

Necesita ampliarse para:
- Generar cotizaciones PDF automáticas
- Seguimiento de cotizaciones (recordatorios)
- Negociación dentro de márgenes aprobados
- Cierre de ventas hasta monto configurado

### "Compras nacionales e internacionales"

**Agente responsable: Procurement Agent (NUEVO)**

```python
class ProcurementAgent:
    """
    Gestión de compras y abastecimiento
    """
    
    async def suggest_purchase_orders(self, tenant_id: str):
        """
        Sugerencias automáticas de órdenes de compra
        """
        # 1. Analizar inventario actual vs proyección de ventas
        inventory = await self.get_current_inventory(tenant_id)
        sales_forecast = await self.forecast_sales(days=60)
        
        # 2. Identificar productos que se agotarán
        reorder_items = []
        for product in inventory:
            days_until_stockout = self.calculate_stockout_date(
                current_stock=product.quantity,
                daily_sales_avg=sales_forecast[product.id].daily_avg
            )
            
            if days_until_stockout <= product.lead_time_days + 7:
                reorder_items.append(product)
        
        # 3. Generar sugerencias de compra por proveedor
        purchase_suggestions = {}
        for item in reorder_items:
            supplier = await self.get_preferred_supplier(item.id)
            if supplier not in purchase_suggestions:
                purchase_suggestions[supplier] = []
            
            purchase_suggestions[supplier].append({
                "product_id": item.id,
                "sku": item.sku,
                "suggested_qty": self.calculate_order_quantity(
                    item, sales_forecast[item.id]
                ),
                "urgency": "HIGH" if days_until_stockout <= 7 else "NORMAL"
            })
        
        # 4. Crear draft de PO para revisión humana
        for supplier, items in purchase_suggestions.items():
            await self.create_draft_purchase_order(
                supplier=supplier,
                items=items,
                tenant_id=tenant_id,
                status="pending_approval"
            )
        
        return purchase_suggestions
```

### "Logística de importación"

**Agente responsable: Import Logistics Agent (NUEVO)**

```python
class ImportLogisticsAgent:
    """
    Seguimiento de importaciones internacionales
    """
    
    async def track_import_shipment(self, shipment_id: str):
        """
        Rastreo de embarques internacionales
        """
        # 1. Obtener status actual del embarque
        status = await self.freight_forwarder_api.get_status(shipment_id)
        
        # 2. Actualizar timeline
        await self.update_shipment_timeline(shipment_id, status)
        
        # 3. Alertas de eventos clave
        if status.event == "arrived_at_port":
            await self.notify_admin(
                f"Embarque {shipment_id} arribó a puerto",
                next_steps="Coordinar despacho aduanal"
            )
        elif status.event == "customs_released":
            await self.notify_admin(
                f"Embarque {shipment_id} liberado por aduana",
                next_steps="Coordinar entrega a almacén"
            )
        
        # 4. Actualizar ETA de productos
        products = await self.get_shipment_products(shipment_id)
        for product in products:
            await self.update_product_eta(
                product_id=product.id,
                eta=status.estimated_delivery_date
            )
```

### "Coordinación con almacén"

**Agente responsable: Warehouse Coordinator Agent (NUEVO)**

```python
class WarehouseCoordinatorAgent:
    """
    Coordinación de tareas de almacén
    """
    
    async def generate_daily_tasks(self, warehouse_id: str, tenant_id: str):
        """
        Genera lista de tareas diarias para almacenistas
        """
        tasks = []
        
        # 1. Órdenes pendientes de surtir (prioridad por deadline)
        pending_orders = await self.get_pending_orders(warehouse_id)
        for order in sorted(pending_orders, key=lambda x: x.deadline):
            tasks.append(Task(
                type="pick_and_pack",
                order_id=order.id,
                priority=self.calculate_priority(order),
                estimated_time_min=self.estimate_pick_time(order.items),
                deadline=order.deadline
            ))
        
        # 2. Recepción de mercancía esperada
        expected_receipts = await self.get_expected_receipts(warehouse_id)
        for receipt in expected_receipts:
            tasks.append(Task(
                type="receive_inventory",
                receipt_id=receipt.id,
                supplier=receipt.supplier,
                items_count=len(receipt.items),
                priority="NORMAL"
            ))
        
        # 3. Conteos cíclicos programados
        cycle_count_items = await self.get_cycle_count_schedule(warehouse_id)
        if cycle_count_items:
            tasks.append(Task(
                type="cycle_count",
                items=cycle_count_items,
                priority="LOW"
            ))
        
        # 4. Reubicaciones sugeridas (productos de alta rotación cerca de empaque)
        relocations = await self.suggest_relocations(warehouse_id)
        if relocations:
            tasks.append(Task(
                type="relocate_inventory",
                items=relocations,
                priority="LOW"
            ))
        
        # 5. Generar PDF con lista de tareas
        pdf = await self.generate_task_sheet(tasks, warehouse_id)
        
        return DailyTaskList(
            tasks=tasks,
            pdf_url=pdf.url,
            total_estimated_time_hours=sum(t.estimated_time_min for t in tasks) / 60
        )
```

### "Desarrollo de nuevos productos"

**Agente responsable: Product Development Assistant Agent (NUEVO)**

```python
class ProductDevelopmentAgent:
    """
    Asistente para desarrollo de nuevos productos
    """
    
    async def analyze_market_opportunity(self, product_idea: str, tenant_id: str):
        """
        Análisis de oportunidad de mercado para nuevo producto
        """
        # 1. Búsqueda de productos similares en ML y Amazon
        similar_ml = await self.ml_adapter.search_products(product_idea)
        similar_amz = await self.amazon_adapter.search_products(product_idea)
        
        # 2. Análisis de competencia
        competition_analysis = {
            "total_competitors": len(similar_ml) + len(similar_amz),
            "price_range": self.calculate_price_range(similar_ml + similar_amz),
            "avg_rating": self.calculate_avg_rating(similar_ml + similar_amz),
            "sales_velocity": self.estimate_sales_velocity(similar_ml + similar_amz),
            "market_saturation": self.calculate_saturation(similar_ml + similar_amz)
        }
        
        # 3. Identificar gaps (qué NO están ofreciendo los competidores)
        gaps = await self.identify_market_gaps(
            similar_ml + similar_amz,
            product_idea
        )
        
        # 4. Sugerencias de diferenciación
        differentiation = await self.suggest_differentiation(
            product_idea,
            competition_analysis,
            gaps
        )
        
        # 5. Proyección financiera
        financial_projection = self.project_financials(
            suggested_price=competition_analysis["price_range"]["median"],
            estimated_monthly_sales=competition_analysis["sales_velocity"]["median"],
            estimated_cost=None  # Requiere input humano
        )
        
        return MarketOpportunityReport(
            product_idea=product_idea,
            competition=competition_analysis,
            gaps=gaps,
            differentiation_suggestions=differentiation,
            financial_projection=financial_projection,
            recommendation=self.generate_recommendation(competition_analysis, gaps)
        )
```

### "Seguimiento a clientes clave"

**Agente responsable: Account Manager Agent (NUEVO)**

```python
class AccountManagerAgent:
    """
    Gestión de relaciones con clientes clave (B2B)
    """
    
    async def manage_key_accounts(self, tenant_id: str):
        """
        Gestión proactiva de cuentas clave
        """
        key_accounts = await self.get_key_accounts(tenant_id)
        
        for account in key_accounts:
            # 1. Revisar actividad reciente
            activity = await self.get_account_activity(
                account.id,
                days=30
            )
            
            # 2. Detectar señales de riesgo
            risk_signals = []
            
            if activity.orders_last_30_days == 0 and activity.orders_prev_30_days > 0:
                risk_signals.append("No ha ordenado en 30 días (antes sí)")
            
            if activity.avg_days_between_orders > activity.historical_avg * 1.5:
                risk_signals.append("Frecuencia de compra bajó 50%")
            
            if activity.last_response_time_hours > 72:
                risk_signals.append("Tardó >72h en responder último mensaje")
            
            # 3. Oportunidades de upsell/cross-sell
            opportunities = await self.identify_opportunities(account)
            
            # 4. Acciones sugeridas
            actions = []
            
            if risk_signals:
                actions.append({
                    "type": "retention_campaign",
                    "account_id": account.id,
                    "reason": risk_signals,
                    "suggested_action": "Llamada telefónica + oferta especial"
                })
            
            if opportunities:
                actions.append({
                    "type": "upsell",
                    "account_id": account.id,
                    "products": opportunities,
                    "suggested_action": "Enviar catálogo de productos complementarios"
                })
            
            # 5. Programar follow-ups automáticos
            if not activity.contacted_last_7_days:
                await self.schedule_followup(
                    account.id,
                    message_template="check_in",
                    days_from_now=1
                )
            
            # 6. Notificar al humano si hay riesgos altos
            if any("No ha ordenado" in signal for signal in risk_signals):
                await self.notify_sales_team(
                    account=account,
                    risk_signals=risk_signals,
                    suggested_actions=actions
                )
```

---

## RESUMEN: AGENTES TOTALES NECESARIOS

### ACTUALIZADOS (de los 26 originales):
1. Router Agent
2. Data Analyst Agent  
3. Report Generator Agent
4. Support Agent
5. Onboarding Agent
6. ML Question Handler → **ampliar capacidades**
7. Amazon Question Handler → **ampliar capacidades**
8. WhatsApp Handler → **ampliar para ventas B2B**
9. Sales Agent B2B → **ampliar con cotizaciones**
10. Inventory Agent → **integrar con Procurement**

### NUEVOS AGENTES (16 adicionales):

**E-COMMERCE (10)**:
11. **ML Listing Optimizer Agent** - Optimización de publicaciones ML
12. **ML Ads Manager Agent** - Gestión de campañas publicitarias ML
13. **ML Analytics Agent** - Análisis profundo de métricas ML
14. **ML Fulfillment Agent** - Logística y fulfillment ML
15. **Amazon Listing Optimizer Agent** - Optimización de publicaciones Amazon
16. **Amazon Ads Manager Agent** - Sponsored Products/Brands/Display
17. **Amazon FBA/FBM Manager Agent** - Gestión completa FBA
18. **Instagram DM Handler Agent** - Mensajes directos Instagram
19. **Instagram Comments Agent** - Respuestas a comentarios
20. **Instagram Content Publisher Agent** - Publicaciones automáticas

**CRM (2)**:
21. **Instagram Ads Manager Agent** - Campañas publicitarias IG
22. **Account Manager Agent** - Gestión de cuentas clave B2B

**ERP (4)**:
23. **Procurement Agent** - Gestión de compras
24. **Import Logistics Agent** - Seguimiento de importaciones
25. **Warehouse Coordinator Agent** - Coordinación de almacén
26. **Product Development Assistant Agent** - Desarrollo de productos

**TOTAL: 42 AGENTES** (26 originales + 16 nuevos)

