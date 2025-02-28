<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b">
      <div className="flex items-center justify-between w-full">
        <h2 className="text-lg font-medium">Jane Export CSV Configuration</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Designs: {designs.length} selected</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>

    {/* Design Thumbnails */}
    <div className="p-6 border-b bg-gray-50/80">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Designs</h3>
      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
        {designs.map((design) => (
          <div key={design.id} className="relative group">
            <div className="aspect-square bg-white rounded-lg border overflow-hidden shadow hover:shadow-lg transition-all">
              <img
                src={design.web_file_url}
                alt={design.title}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex flex-col items-center justify-center p-2">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                <p className="text-sm font-medium text-white mb-1 line-clamp-2">
                  {design.title}
                </p>
                <p className="text-xs text-gray-200">
                  {design.sku}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Configuration Form */}
    <div className="p-6">
      {/* Product Category */}
      <ProductCategory