import { serve } from "bun";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "path";

const prisma = new PrismaClient();

serve({
    port: 3000,
    async fetch(request) {
        const url = new URL(request.url);

        console.log(`${request.method} - ${url.pathname}`); // Debug log

        // CORS headers
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Auth-Token",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 200, headers });
        }

        // API routes

        if (url.pathname === "/api/sign-in" && request.method === "POST") {
            try {
                const { email, password } = await request.json();
                console.log(`Sign-in attempt: ${email}`);

                // Find user
                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    return new Response(
                        JSON.stringify({ success: false, message: "Email or password is incorrect" }),
                        {
                            status: 401,
                            headers: {
                                ...headers,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                }

                // Check password
                const passwordValid = await bcrypt.compare(password, user.password);

                if (!passwordValid) {
                    return new Response(
                        JSON.stringify({ success: false, message: "Email or password is incorrect" }),
                        {
                            status: 401,
                            headers: {
                                ...headers,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                }

                console.log(`User signed in: ${user.email}`);

                return new Response(
                    JSON.stringify({ success: true, token: "valid-token", userId: user.id }),
                    {
                        status: 200,
                        headers: {
                            ...headers,
                            "Content-Type": "application/json"
                        }
                    }
                );
            } catch (error) {
                console.error('Sign-in error:', error);
                return new Response(
                    JSON.stringify({ success: false, message: "Error signing in" }),
                    {
                        status: 500,
                        headers: {
                            ...headers,
                            "Content-Type": "application/json"
                        }
                    }
                );
            }
        }

        // Invoice API endpoints
        if (url.pathname === "/api/invoices") {
            if (request.method === "POST") {
                try {
                    const invoiceData = await request.json();
                    console.log('Creating invoice:', invoiceData);

                    // Calculate sum: (price * quantity) + VAT
                    const subtotal = invoiceData.price * invoiceData.quantity;
                    const vatAmount = subtotal * (invoiceData.vatPercentage / 100);
                    const sum = subtotal + vatAmount;

                    const invoice = await prisma.invoice.create({
                        data: {
                            date: invoiceData.date,
                            description: invoiceData.description,
                            quantity: invoiceData.quantity,
                            paymentMethod: invoiceData.paymentMethod,
                            currency: invoiceData.currency,
                            invoiceNumber: invoiceData.invoiceNumber,
                            vatPercentage: invoiceData.vatPercentage,
                            price: invoiceData.price,
                            sum: sum
                        }
                    });

                    console.log('Invoice created:', invoice);

                    return new Response(
                        JSON.stringify({ success: true, invoice }),
                        {
                            status: 201,
                            headers: {
                                ...headers,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error creating invoice:', error);
                    return new Response(
                        JSON.stringify({ success: false, message: "Error creating invoice" }),
                        {
                            status: 500,
                            headers: {
                                ...headers,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                }
            } else if (request.method === "GET") {
                try {
                    const invoices = await prisma.invoice.findMany({
                        orderBy: { createdAt: 'desc' }
                    });

                    return new Response(
                        JSON.stringify({ success: true, invoices }),
                        {
                            status: 200,
                            headers: {
                                ...headers,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                } catch (error) {
                    console.error('Error fetching invoices:', error);
                    return new Response(
                        JSON.stringify({ success: false, message: "Error fetching invoices" }),
                        {
                            status: 500,
                            headers: {
                                ...headers,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                }
            }
        }

        // Get the client path correctly
        const clientPath = path.resolve(path.dirname(import.meta.path), "../../client");

        // For ALL requests, serve the index.html
        // Let the frontend JavaScript handle authentication logic
        let filePath = path.join(clientPath, url.pathname === "/" || url.pathname === "/dashboard" || url.pathname === "/invoices" ? "index.html" : url.pathname);

        try {
            const file = Bun.file(filePath);
            const exists = await file.exists();

            if (!exists) {
                // For SPA-style routing, return index.html for unknown routes
                const indexFile = Bun.file(path.join(clientPath, "index.html"));
                return new Response(await indexFile.text(), {
                    headers: { ...headers, "Content-Type": "text/html" }
                });
            }

            // Set appropriate content type
            let contentType = "text/plain";
            if (filePath.endsWith(".html")) contentType = "text/html";
            else if (filePath.endsWith(".css")) contentType = "text/css";
            else if (filePath.endsWith(".js")) contentType = "application/javascript";

            return new Response(await file.text(), {
                headers: { ...headers, "Content-Type": contentType }
            });
        } catch (error) {
            console.error('File serving error:', error);
            // Return index.html as fallback
            const indexFile = Bun.file(path.join(clientPath, "index.html"));
            return new Response(await indexFile.text(), {
                headers: { ...headers, "Content-Type": "text/html" }
            });
        }
    },
});

console.log("Server running on http://localhost:3000");