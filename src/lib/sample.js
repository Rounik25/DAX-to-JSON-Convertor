/**
 * Example query used by the "Load example" button and by the tests.
 *
 * Deliberately generic: it mirrors the shape the Performance Analyzer emits
 * (DEFINE, filter VARs, SUMMARIZECOLUMNS, SELECTCOLUMNS, TOPN, ORDER BY) with
 * tabs, nested quotes and table names containing spaces and a slash, so every
 * escaping case is covered without putting a real model in the repository.
 */
export const SAMPLE_DAX = `
// DAX Query
DEFINE
	VAR __FilterStatus =
		FILTER(
			KEEPFILTERS(VALUES('Order/Line Item'[Status])),
			'Order/Line Item'[Status] = "Open"
		)

	VAR __FilterYear =
		FILTER(
			KEEPFILTERS(VALUES('Calendar'[Year])),
			'Calendar'[Year] >= 2024
		)

	VAR __Core =
		SELECTCOLUMNS(
			KEEPFILTERS(
				SUMMARIZECOLUMNS(
					'Customer'[Customer Name],
					'Customer'[Region],
					'Product'[Product Name],
					'Order/Line Item'[Order Number],
					'Order/Line Item'[Status],
					__FilterStatus,
					__FilterYear,
					"SumOrderQuantity", SUM('Order/Line Item'[Quantity]),
					"SumOrderRevenue", SUM('Order/Line Item'[Revenue])
				)
			),
			"'Customer'[Customer Name]", 'Customer'[Customer Name],
			"'Customer'[Region]", 'Customer'[Region],
			"'Product'[Product Name]", 'Product'[Product Name],
			"'Order/Line Item'[Order Number]", 'Order/Line Item'[Order Number],
			"SumOrderQuantity", [SumOrderQuantity],
			"SumOrderRevenue", [SumOrderRevenue]
		)

	VAR __Windowed =
		TOPN(
			501,
			__Core,
			'Customer'[Customer Name],
			1,
			'Product'[Product Name],
			1
		)

EVALUATE
	__Windowed

ORDER BY
	'Customer'[Customer Name],
	'Product'[Product Name]
`.trim();
