import { useState } from "react";

export default function WordProblemGame({
  question,
  currencies,
  IMAGE_BASE,
  onSubmit
}) {

  const [wallet, setWallet] = useState([]);
  const [total, setTotal] = useState(0);

  const handleDragStart = (e, currency) => {
    e.dataTransfer.setData("currency", JSON.stringify(currency));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const currency = JSON.parse(e.dataTransfer.getData("currency"));

    const id = Date.now();

    setWallet(prev => [...prev, { ...currency, id }]);
    setTotal(prev => prev + currency.value);
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const removeFromWallet = (id, value) => {
    setWallet(prev => prev.filter(c => c.id !== id));
    setTotal(prev => prev - value);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Question */}
      <div className="bg-[#f1e3d4] rounded-xl p-4 text-center font-semibold">
        {question.question_text}
      </div>

      {/* Item + Wallet */}
      <div className="grid grid-cols-2 bg-white rounded-2xl shadow overflow-hidden">

        {/* ITEM */}
        <div className="p-6 text-center border-r">
          <p className="text-sm text-gray-500 mb-2">ITEM</p>

          <img
            src={`${IMAGE_BASE}${question.item_image}`}
            className="w-24 h-24 mx-auto mb-2"
          />

          <p className="font-semibold">{question.item_name}</p>

          <p className="text-orange-600 font-bold text-lg">
            ₹{question.price}
          </p>
        </div>

        {/* WALLET */}
        <div className="p-6">

          <p className="text-sm text-gray-500 mb-2">Wallet</p>

          <div
            onDrop={handleDrop}
            onDragOver={allowDrop}
            className="border-2 border-dashed rounded-xl h-28 flex flex-wrap items-center justify-center gap-2 p-2"
          >

            {wallet.length === 0 && (
              <span className="text-gray-400 text-sm">
                Drag coins here
              </span>
            )}

            {wallet.map(c => (
              <img
                key={c.id}
                src={`${IMAGE_BASE}${c.front_image}`}
                className="w-12 h-12 cursor-pointer"
                onClick={() => removeFromWallet(c.id, c.value)}
              />
            ))}

          </div>

          <div className="flex justify-between mt-3 font-semibold">
            <span>Total:</span>
            <span>₹{total}</span>
          </div>

        </div>

      </div>

      {/* Available Money */}
      <div>
        <p className="text-center text-sm font-semibold text-gray-500 mb-3">
          AVAILABLE MONEY
        </p>

        <div className="flex flex-wrap justify-center gap-3">

          {currencies.map((currency,index) => {

            const img = `${IMAGE_BASE}${currency.front_image}`;

            return (
              <img
                key={index}
                src={img}
                draggable
                onDragStart={(e)=>handleDragStart(e,currency)}
                className="w-14 h-14 cursor-grab active:scale-95"
              />
            );

          })}

        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">

        <button
          onClick={() => onSubmit(total)}
          className="bg-orange-400 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Pay ₹{total} ✓
        </button>

      </div>

    </div>
  );
}