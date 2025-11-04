// src/pages/PaymentPage.jsx
import React, { useState } from "react";

export default function PaymentPage() {
    const [invoice, setInvoice] = useState(null);

    const handlePayment = async () => {
        const res = await fetch("/api/invoice/create/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        const data = await res.json();
        setInvoice(data);
    };

    return (
        <div className="p-4">
            <h2>QPay төлбөрийн жишээ</h2>
            <button onClick={handlePayment}>Төлбөр үүсгэх</button>
            {invoice && (
                <pre className="mt-4 bg-gray-100 p-2 rounded">
          {JSON.stringify(invoice, null, 2)}
        </pre>
            )}
        </div>
    );
}
