/**
 * div مخفي يُعرض فقط عند الطباعة - مُحسَّن لطابعات 80mm الحرارية
 * استخدم: printReceipt(saleData, settings)
 */
export function printReceipt(sale, settings) {
  const el = document.getElementById('thermal-receipt')
  if (!el) return

  const date = new Date(sale.created_at).toLocaleString('ar-SA', {
    dateStyle: 'short', timeStyle: 'short'
  })
  const payLabel = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل' }
  const cur = settings?.currency || 'ر.س'

  const itemsHtml = (sale.items || []).map(item => `
    <div class="r-row">
      <span>${item.total_price.toFixed(2)}</span>
      <span>${item.product_name} ×${item.quantity}</span>
    </div>
  `).join('')

  el.innerHTML = `
    <div class="r-title">${settings?.store_name || 'متجري'}</div>
    <div class="r-center" style="font-size:11px;margin-bottom:4px;">${date}</div>
    <div class="r-divider"></div>
    <div class="r-row" style="font-size:11px;">
      <span>${sale.invoice_number || ''}</span>
      <span>${payLabel[sale.payment_method] || ''}</span>
    </div>
    <div class="r-divider"></div>
    ${itemsHtml}
    <div class="r-divider"></div>
    <div class="r-row"><span>المجموع</span><span>${(sale.subtotal || 0).toFixed(2)}</span></div>
    ${sale.discount > 0 ? `<div class="r-row"><span>خصم</span><span>-${sale.discount.toFixed(2)}</span></div>` : ''}
    <div class="r-divider"></div>
    <div class="r-row r-total">
      <span>${(sale.total || 0).toFixed(2)} ${cur}</span>
      <span>الإجمالي</span>
    </div>
    <div class="r-divider"></div>
    <div class="r-footer">${settings?.receipt_footer || 'شكراً لزيارتكم'}</div>
    <div style="margin-top:16px;"></div>
  `

  window.print()
}

export default function ThermalReceiptDiv() {
  return <div id="thermal-receipt" style={{ display: 'none' }} />
}
