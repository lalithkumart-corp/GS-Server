-- STOCK VIEW
SELECT
	dealer_purchase_bill.id AS PurchaseBillId,
	suppliers.name AS SuplierName,
	metal.name AS Metal,
	item_category.name AS Name,
	item_subcategory.name AS ItemCategory,
	stock.quantity AS PurchasedQty,
	stock.sold_qty AS SoldQty,
	stock.avl_qty AS AvlQty,
	stock.metal_rate AS MetalRate,
	touch.name AS Touch,
	stock.gross_wt AS GrossWt,
	stock.pure_wt AS PureWt
FROM
	stock
	LEFT JOIN dealer_purchase_bill ON stock.purchase_bill = dealer_purchase_bill.id
	LEFT JOIN suppliers ON dealer_purchase_bill.supplier_id = suppliers.id
	LEFT JOIN orn_list_jewellery ON stock.ornament = orn_list_jewellery.id
	LEFT JOIN metal ON orn_list_jewellery.metal = metal.id
	LEFT JOIN item_category ON orn_list_jewellery.item_category = item_category.id
	LEFT JOIN item_subcategory ON orn_list_jewellery.item_subcategory = item_subcategory.id
	LEFT JOIN touch ON stock.touch_id = touch.id