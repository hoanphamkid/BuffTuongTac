CREATE TABLE "OrderReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrderReview_rating_check" CHECK ("rating" BETWEEN 1 AND 5),
    CONSTRAINT "OrderReview_content_check" CHECK (char_length(trim("content")) BETWEEN 10 AND 1000)
);

CREATE UNIQUE INDEX "OrderReview_orderId_key" ON "OrderReview"("orderId");
CREATE INDEX "OrderReview_createdAt_id_idx" ON "OrderReview"("createdAt", "id");
CREATE INDEX "OrderReview_rating_createdAt_id_idx" ON "OrderReview"("rating", "createdAt", "id");

ALTER TABLE "OrderReview" ADD CONSTRAINT "OrderReview_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
