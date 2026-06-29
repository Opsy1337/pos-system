export default function Receipt({ sale }) {
  if (!sale) return null
  const s = sale.settings || {}
  const storeName = s.store_name || 'متجري'
  const currency = s.currency || 'ر.س'
  const footer = s.receipt_footer || 'شكراً لزيارتكم'
  const phone = s.store_address || ''

  const paymentLabels = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل بنكي' }

  return (
    <div className="receipt-font p-4 text-center text-gray-900 text-sm print-area" style={{ fontFamily: 'monospace', direction: 'rtl' }}>
      <div className="text-xl font-bold mb-1">{storeName}</div>
      {s.store_address && <div className="text-xs text-gray-500 mb-1">{s.store_address}</div>}
      {s.store_phone && <div className="text-xs text-gray-500 mb-2">📞 {s.store_phone}</div>}

      <div className="border-t border-b border-dashed border-gray-400 py-2 my-2 text-xs space-y-1">
        <div className="flex justify-between"><span>رقم الفاتورة:</span><span className="font-bold">{sale.invoice_number}</span></div>
        <div className="flex justify-between"><span>التاريخ:</span><span>{new Date(sale.created_at).toLocaleDateString('ar-SA')}</span></div>
        <div className="flex justify-between"><span>الوقت:</span><span>{new Date(sale.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span></div>
        <div className="flex justify-between"><span>الكاشير:</span><span>{sale.cashier?.name || '-'}</span></div>
        <div className="flex justify-between"><span>الدفع:</span><span>{paymentLabels[sale.payment_method] || sale.payment_method}</span></div>
      </div>

      <table className="w-full text-xs mb-2">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="text-right py-1">الصنف</th>
            <th className="text-center py-1">الكمية</th>
            <th className="text-center py-1">السعر</th>
            <th className="text-left py-1">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, i) => (
            <tr key={i} className="border-b border-dashed border-gray-200">
              <td className="py-1 text-right">{item.product_name}</td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-center py-1">{item.unit_price.toFixed(2)}</td>
              <td className="text-left py-1">{item.total_price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 pt-2 text-xs space-y-1">
        <div className="flex justify-between"><span>المجموع الفرعي</span><span>{sale.subtotal?.toFixed(2)} {currency}</span></div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>خصم {sale.discount_type === 'percent' ? `(${sale.discount}%)` : ''}</span>
            <span>- {((sale.discount_type === 'percent' ? sale.subtotal * sale.discount / 100 : sale.discount)).toFixed(2)} {currency}</span>
          </div>
        )}
        <div className="flex justify-between"><span>ضريبة القيمة المضافة ({sale.tax_rate}%)</span><span>{sale.tax_amount?.toFixed(2)} {currency}</span></div>
        <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-1 mt-1">
          <span>الإجمالي</span>
          <span>{sale.total?.toFixed(2)} {currency}</span>
        </div>
      </div>

      {sale.notes && (
        <div className="mt-2 text-xs text-gray-500 border-t pt-2">ملاحظة: {sale.notes}</div>
      )}

      <div className="mt-4 border-t border-dashed border-gray-400 pt-3 text-xs text-gray-500">
        <p className="font-semibold text-gray-700">{footer}</p>
        <p className="mt-1">رقم الضريبة: 310XXXXXXXXX</p>
        <div className="mt-3 text-center">
          <div className="text-4xl tracking-widest font-mono border border-gray-300 inline-block px-3 py-1 rounded">
            ||||| ||||| |||||
          </div>
          <p className="text-xs mt-1">{sale.invoice_number}</p>
        </div>
      </div>
    </div>
  )
}
