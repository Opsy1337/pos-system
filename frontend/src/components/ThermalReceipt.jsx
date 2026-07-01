export function printReceipt(sale, settings) {
  const date = new Date(sale.created_at).toLocaleString('ar-SA', {
    dateStyle: 'short', timeStyle: 'short'
  })
  const payLabel = { cash: 'نقدي', card: 'شبكة', transfer: 'تحويل' }
  const cur = settings?.currency || 'ر.س'
  const storeName = settings?.store_name || 'متجري'
  const footer = settings?.receipt_footer || 'شكراً لزيارتكم'

  const itemsHtml = (sale.items || []).map(item => `
    <tr>
      <td style="text-align:left">${item.total_price.toFixed(2)}</td>
      <td style="text-align:right">${item.product_name} ×${item.quantity}</td>
    </tr>
  `).join('')

  const discountHtml = sale.discount > 0 ? `
    <tr>
      <td style="text-align:left;color:green">-${sale.discount.toFixed(2)}</td>
      <td style="text-align:right">خصم</td>
    </tr>
  ` : ''

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 80mm auto; margin: 3mm 2mm; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 13px;
    width: 76mm;
    color: #000;
    direction: rtl;
  }
  .center { text-align: center; }
  .store { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 2px; }
  .small { font-size: 11px; color: #333; }
  hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; }
  .total-row td { font-size: 15px; font-weight: bold; border-top: 1px dashed #000; padding-top: 4px; }
  .footer { text-align: center; font-size: 11px; margin-top: 10px; }
</style>
</head>
<body>
  <div class="store">${storeName}</div>
  <div class="center small">${date}</div>
  <hr>
  <table>
    <tr>
      <td style="text-align:left" class="small">${payLabel[sale.payment_method] || ''}</td>
      <td style="text-align:right" class="small">${sale.invoice_number || ''}</td>
    </tr>
  </table>
  <hr>
  <table>${itemsHtml}</table>
  <hr>
  <table>
    <tr>
      <td style="text-align:left">${(sale.subtotal || 0).toFixed(2)}</td>
      <td style="text-align:right">المجموع</td>
    </tr>
    ${discountHtml}
    <tr class="total-row">
      <td style="text-align:left">${(sale.total || 0).toFixed(2)} ${cur}</td>
      <td style="text-align:right">الإجمالي</td>
    </tr>
  </table>
  <div class="footer">${footer}</div>
  <br><br>
</body>
</html>`

  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

export default function ThermalReceiptDiv() {
  return null
}
