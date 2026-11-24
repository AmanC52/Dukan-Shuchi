// Universal Print, PDF & Sharing Helper for Dukan Tool
// Guarantees zero text overlap, single-page print formatting,
// and native WhatsApp/Clipboard sharing for Mobile APK & Desktop!

const PrintHelper = {
  // 1. Generate clean, single-page HTML receipt
  generateReceiptHtml(data) {
    const rowsHtml = (data.items || []).map((it, idx) => {
      const pPrice = Number(it.purchase_price) || 0;
      const sPrice = Number(it.selling_price) || 0;
      const subP = Number(it.subtotal_purchase) || (pPrice * (it.quantity || 1));
      const subS = Number(it.subtotal_selling) || (sPrice * (it.quantity || 1));
      const profit = Number(it.profit) || (subS - subP);

      return `
        <tr style="border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 6px 8px; text-align: left; vertical-align: top;">
            <div style="font-weight: 700; color: #0f172a; font-size: 13px;">${idx + 1}. ${it.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${it.unit || 'पेटी'}${it.sub_info ? ' (' + it.sub_info + ')' : ''}
            </div>
          </td>
          <td style="padding: 6px 8px; text-align: center; font-weight: 800; font-size: 13px; vertical-align: middle;">
            ${it.quantity}
          </td>
          <td style="padding: 6px 8px; text-align: right; font-size: 12px; color: #334155; vertical-align: middle;">
            ₹${pPrice.toFixed(2)}
          </td>
          <td style="padding: 6px 8px; text-align: right; font-weight: 800; font-size: 13px; color: #1e3a8a; vertical-align: middle;">
            ₹${subP.toFixed(2)}
          </td>
          <td style="padding: 6px 8px; text-align: right; font-size: 12px; color: #334155; vertical-align: middle;">
            ₹${sPrice.toFixed(2)}
          </td>
          <td style="padding: 6px 8px; text-align: right; font-weight: 800; font-size: 13px; color: #059669; vertical-align: middle;">
            +₹${profit.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>दुकान सामान खरीद पर्ची - ${data.trip_date || ''}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Devanagari", sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 8px;
      font-size: 12px;
      line-height: 1.35;
    }
    .receipt-container {
      max-width: 820px;
      margin: 0 auto;
      border: 2px solid #0f172a;
      border-radius: 6px;
      padding: 14px 18px;
    }
    .receipt-header {
      text-align: center;
      border-bottom: 2px dashed #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .receipt-title {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 2px 0;
      color: #0f172a;
    }
    .receipt-sub {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 6px 0;
    }
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      padding: 0 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      table-layout: auto;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 7px 8px;
      border-top: 1.5px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
    }
    .summary-card {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 16px;
      margin-top: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .sum-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .sum-row.total {
      border-top: 1.5px solid #0f172a;
      padding-top: 6px;
      margin-top: 6px;
      font-size: 14px;
      font-weight: 800;
      color: #059669;
    }
    .receipt-footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      margin-top: 10px;
      border-top: 1px dotted #cbd5e1;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <h1 class="receipt-title">दुकान सामान खरीद पर्ची</h1>
      <div class="receipt-sub">दुकान सहायक (Dukan Assistant Pro) - थोक खरीद व मार्जिन रिपोर्ट</div>
      <div class="receipt-meta">
        <div><strong>तारीख:</strong> ${data.trip_date || '--'}</div>
        <div><strong>मंडी / विवरण:</strong> ${data.title || 'सदर मंडी खरीदारी'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="text-align: left;">सामान का नाम</th>
          <th style="text-align: center; width: 65px;">मात्रा</th>
          <th style="text-align: right; width: 85px;">खरीद दर</th>
          <th style="text-align: right; width: 95px;">कुल लागत</th>
          <th style="text-align: right; width: 95px;">बिक्री मूल्य</th>
          <th style="text-align: right; width: 95px;">शुद्ध लाभ</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="summary-card">
      <div class="sum-row">
        <span>कुल सामान प्रकार:</span>
        <strong>${data.total_items} प्रकार का सामान</strong>
      </div>
      <div class="sum-row" style="font-size: 13px;">
        <span>कुल खरीद भुगतान:</span>
        <strong style="color: #1e3a8a;">₹${Number(data.total_purchase).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
      <div class="sum-row">
        <span>कुल संभावित बिक्री:</span>
        <strong>₹${Number(data.total_selling).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
      <div class="sum-row total">
        <span>कुल अनुमानित शुद्ध मुनाफा:</span>
        <span>+₹${Number(data.total_profit).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${data.margin_percent}% मार्जिन)</span>
      </div>
    </div>

    <div class="receipt-footer">
      दुकान सहायक - भारतीय किराना दुकानदारों का स्मार्ट खरीद व मुनाफा प्रबंधक
    </div>
  </div>
</body>
</html>
    `;
  },

  // 2. Isolated print via hidden iframe (prevents main page text overlap and phantom pages)
  printHtml(htmlContent) {
    const oldIframe = document.getElementById('dukanPrintIframe');
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'dukanPrintIframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '900px';
    iframe.style.height = '900px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print():', err);
        window.print();
      }
    }, 300);
  },

  // 3. Generate clean, well-aligned plain text receipt for WhatsApp & Clipboard
  generateTextReceipt(data) {
    let txt = `================================\n`;
    txt += `📋 दुकान सामान खरीद पर्ची\n`;
    txt += `📅 तारीख: ${data.trip_date || '--'} | 📍 ${data.title || 'मंडी खरीदारी'}\n`;
    txt += `================================\n\n`;

    (data.items || []).forEach((it, idx) => {
      const pPrice = Number(it.purchase_price) || 0;
      const sPrice = Number(it.selling_price) || 0;
      const subP = Number(it.subtotal_purchase) || (pPrice * (it.quantity || 1));
      const subS = Number(it.subtotal_selling) || (sPrice * (it.quantity || 1));
      const prof = Number(it.profit) || (subS - subP);

      txt += `${idx + 1}. ${it.name}\n`;
      txt += `   पैकिंग: ${it.unit || 'पेटी'}${it.sub_info ? ' (' + it.sub_info + ')' : ''}\n`;
      txt += `   मात्रा: ${it.quantity} | थोक खरीद: ₹${pPrice.toFixed(2)}\n`;
      txt += `   लागत: ₹${subP.toFixed(2)} | बिक्री: ₹${subS.toFixed(2)}\n`;
      txt += `   शुद्ध मुनाफा: +₹${prof.toFixed(2)}\n\n`;
    });

    txt += `--------------------------------\n`;
    txt += `📦 कुल सामान प्रकार: ${data.total_items}\n`;
    txt += `💰 कुल खरीद भुगतान: ₹${Number(data.total_purchase).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    txt += `📈 कुल संभावित बिक्री: ₹${Number(data.total_selling).toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
    txt += `💵 कुल शुद्ध मुनाफा: +₹${Number(data.total_profit).toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${data.margin_percent}%)\n`;
    txt += `================================\n`;
    txt += `दुकान सहायक (Dukan Assistant Pro)\n`;
    return txt;
  },

  // 4. Share to WhatsApp
  shareWhatsApp(data) {
    const text = this.generateTextReceipt(data);
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  },

  // 5. Copy receipt text to clipboard
  async copyText(data) {
    const text = this.generateTextReceipt(data);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        if (typeof App !== 'undefined' && App.showToast) {
          App.showToast('पर्ची क्लिपबोर्ड पर कॉपी हो गई!', 'success');
        }
        return;
      }
    } catch (_) {}

    // Fallback for older webview / browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    if (typeof App !== 'undefined' && App.showToast) {
      App.showToast('पर्ची क्लिपबोर्ड पर कॉपी हो गई!', 'success');
    }
  },

  // 6. Mobile Web Share (Triggers Android native share sheet for WhatsApp, Drive PDF, Print, etc.)
  async shareMobile(data) {
    const text = this.generateTextReceipt(data);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `खरीदारी पर्ची - ${data.trip_date || ''}`,
          text: text
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          this.shareWhatsApp(data);
        }
      }
    } else {
      this.shareWhatsApp(data);
    }
  }
};

if (typeof window !== 'undefined') {
  window.PrintHelper = PrintHelper;
}
