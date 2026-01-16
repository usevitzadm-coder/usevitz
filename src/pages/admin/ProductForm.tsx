import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Upload, Package, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().min(0.01, 'Preço deve ser maior que 0'),
});

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Variant {
  id?: string;
  size: string;
  color: string;
  color_hex: string;
  sku: string;
  price: number | null;
  stock: number;
  is_active: boolean;
}

interface ProductImage {
  id?: string;
  url: string;
  is_primary: boolean;
  display_order: number;
  file?: File;
}

interface ComponentProduct {
  id: string;
  name: string;
  variants: ComponentVariant[];
}

interface ComponentVariant {
  id: string;
  size: string;
  color: string;
  color_hex: string;
  stock: number;
}

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];

interface ColorOption {
  id: string;
  name: string;
  hex_code: string;
}

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [badge, setBadge] = useState<string>('');
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [sizeGuide, setSizeGuide] = useState('');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);

  // Bundle (Conjunto) state
  const [isBundle, setIsBundle] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ComponentProduct[]>([]);
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);

  // Function to calculate bundle stock for a variant
  const calculateBundleStock = useCallback((variantSize: string, variantColor: string): number | null => {
    if (!isBundle || selectedComponentIds.length === 0) return null;
    
    const selectedProducts = availableProducts.filter(p => 
      selectedComponentIds.includes(p.id)
    );
    
    if (selectedProducts.length === 0) return 0;
    
    const matchingStocks: number[] = [];
    
    for (const product of selectedProducts) {
      const matchingVar = product.variants?.find(
        v => v.size?.toLowerCase() === variantSize?.toLowerCase() && 
             v.color?.toLowerCase() === variantColor?.toLowerCase()
      );
      
      if (matchingVar) {
        matchingStocks.push(matchingVar.stock);
      } else {
        matchingStocks.push(0);
      }
    }
    
    return matchingStocks.length > 0 ? Math.min(...matchingStocks) : 0;
  }, [isBundle, selectedComponentIds, availableProducts]);

  // Handler for bundle toggle
  const handleBundleToggle = useCallback((checked: boolean) => {
    setIsBundle(checked);
    if (!checked) {
      setSelectedComponentIds([]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchColors();
    fetchAvailableProducts();
    if (isEditing) {
      fetchProduct();
      fetchBundleData();
    }
  }, [id]);

  useEffect(() => {
    if (name && !isEditing) {
      setSlug(generateSlug(name));
    }
  }, [name, isEditing]);

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setCategories(data || []);
  }

  async function fetchTags() {
    const { data } = await supabase
      .from('tags')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setTags(data || []);
  }

  async function fetchColors() {
    const { data } = await supabase
      .from('colors')
      .select('id, name, hex_code')
      .eq('is_active', true)
      .order('display_order');
    setColorOptions(data || []);
  }

  async function fetchAvailableProducts() {
    // Fetch all active products with their variants (excluding the current product if editing)
    const query = supabase
      .from('products')
      .select(`
        id,
        name,
        variants:product_variants(id, size, color, color_hex, stock)
      `)
      .eq('is_active', true)
      .order('name');

    const { data } = await query;
    
    // Filter out the current product if editing
    const filtered = (data || []).filter(p => p.id !== id);
    setAvailableProducts(filtered as ComponentProduct[]);
  }

  async function fetchBundleData() {
    if (!id) return;
    
    try {
      // Check if this product is a bundle
      const { data: bundleData } = await supabase
        .from('product_bundles')
        .select('component_product_id')
        .eq('bundle_product_id', id);

      if (bundleData && bundleData.length > 0) {
        setIsBundle(true);
        setSelectedComponentIds(bundleData.map(b => b.component_product_id));
      }
    } catch (error) {
      console.error('Error fetching bundle data:', error);
    }
  }

  async function fetchProduct() {
    setIsLoading(true);
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(*),
          variants:product_variants(*),
          product_tags(tag_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setName(product.name);
      setSlug(product.slug);
      setDescription(product.description || '');
      setShortDescription(product.short_description || '');
      setPrice(product.price?.toString() || '');
      setOriginalPrice(product.original_price?.toString() || '');
      setCategoryId(product.category_id || '');
      setIsActive(product.is_active);
      setBadge(product.badge || '');
      setBenefits(product.benefits?.length ? product.benefits : ['']);
      setSizeGuide(product.size_guide || '');
      setSelectedTags(product.product_tags?.map((pt: any) => pt.tag_id) || []);
      setVariants(product.variants || []);
      setImages(product.images?.sort((a: any, b: any) => a.display_order - b.display_order) || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o produto.',
        variant: 'destructive',
      });
      navigate('/admin/produtos');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validation = productSchema.safeParse({
      name,
      price: parseFloat(price) || 0,
    });

    if (!validation.success) {
      toast({
        title: 'Erro de validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    // Check if active product has stock
    if (isActive && variants.length > 0) {
      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
      if (totalStock === 0) {
        toast({
          title: 'Atenção',
          description: 'Produto ativo deve ter estoque disponível.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      const productData = {
        name,
        slug,
        description: description || null,
        short_description: shortDescription || null,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        category_id: categoryId || null,
        is_active: isActive,
        badge: badge || null,
        benefits: benefits.filter(b => b.trim()),
        size_guide: sizeGuide || null,
      };

      let productId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Handle tags
      if (productId) {
        await supabase.from('product_tags').delete().eq('product_id', productId);
        if (selectedTags.length > 0) {
          await supabase.from('product_tags').insert(
            selectedTags.map(tagId => ({
              product_id: productId,
              tag_id: tagId,
            }))
          );
        }
      }

      // Handle variants
      if (productId && variants.length > 0) {
        // Delete removed variants
        if (isEditing) {
          const existingIds = variants.filter(v => v.id).map(v => v.id);
          if (existingIds.length > 0) {
            await supabase
              .from('product_variants')
              .delete()
              .eq('product_id', productId)
              .not('id', 'in', `(${existingIds.join(',')})`);
          } else {
            await supabase
              .from('product_variants')
              .delete()
              .eq('product_id', productId);
          }
        }

        // Upsert variants
        for (const variant of variants) {
          // Calculate stock for bundle variants
          let stockToSave = variant.stock;
          if (isBundle && selectedComponentIds.length > 0) {
            const selectedProducts = availableProducts.filter(p => 
              selectedComponentIds.includes(p.id)
            );
            const matchingStocks: number[] = [];
            
            for (const product of selectedProducts) {
              const matchingVar = product.variants?.find(
                v => v.size?.toLowerCase() === variant.size?.toLowerCase() && 
                     v.color?.toLowerCase() === variant.color?.toLowerCase()
              );
              
              if (matchingVar) {
                matchingStocks.push(matchingVar.stock);
              } else {
                matchingStocks.push(0);
              }
            }
            
            stockToSave = matchingStocks.length > 0 ? Math.min(...matchingStocks) : 0;
          }

          const variantData = {
            product_id: productId,
            size: variant.size,
            color: variant.color,
            color_hex: variant.color_hex,
            sku: variant.sku,
            price: variant.price,
            stock: stockToSave,
            is_active: variant.is_active,
          };

          if (variant.id) {
            await supabase
              .from('product_variants')
              .update(variantData)
              .eq('id', variant.id);
          } else {
            await supabase
              .from('product_variants')
              .insert(variantData);
          }
        }
      }

      // Handle image uploads
      if (productId) {
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.file) {
            const fileExt = img.file.name.split('.').pop();
            const fileName = `${productId}/${Date.now()}-${i}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('products')
              .upload(fileName, img.file);

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              continue;
            }

            const { data: publicUrl } = supabase.storage
              .from('products')
              .getPublicUrl(fileName);

            await supabase.from('product_images').insert({
              product_id: productId,
              url: publicUrl.publicUrl,
              is_primary: img.is_primary,
              display_order: i,
            });
          } else if (img.id) {
            await supabase
              .from('product_images')
              .update({ is_primary: img.is_primary, display_order: i })
              .eq('id', img.id);
          }
        }
      }

      // Handle bundle/conjunto data
      if (productId) {
        // First delete existing bundle relationships
        await supabase
          .from('product_bundles')
          .delete()
          .eq('bundle_product_id', productId);

        // Delete existing variant links
        const { data: existingVariants } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId);

        if (existingVariants && existingVariants.length > 0) {
          await supabase
            .from('bundle_variant_links')
            .delete()
            .in('bundle_variant_id', existingVariants.map(v => v.id));
        }

        // If this is a bundle, create new relationships
        if (isBundle && selectedComponentIds.length > 0) {
          // Create product_bundles entries
          await supabase.from('product_bundles').insert(
            selectedComponentIds.map(componentId => ({
              bundle_product_id: productId,
              component_product_id: componentId,
            }))
          );

          // Get fresh variant IDs after any upserts
          const { data: bundleVariants } = await supabase
            .from('product_variants')
            .select('id, size, color')
            .eq('product_id', productId);

          // Get component variants
          const componentVariantsMap: Record<string, { id: string; size: string; color: string }[]> = {};
          for (const compId of selectedComponentIds) {
            const { data: compVars } = await supabase
              .from('product_variants')
              .select('id, size, color')
              .eq('product_id', compId);
            if (compVars) {
              componentVariantsMap[compId] = compVars;
            }
          }

          // Create bundle_variant_links - match by size and color
          if (bundleVariants) {
            const linksToInsert: { bundle_variant_id: string; component_variant_id: string }[] = [];
            
            for (const bundleVar of bundleVariants) {
              for (const compId of selectedComponentIds) {
                const compVars = componentVariantsMap[compId] || [];
                // Find matching component variant by size and color (case-insensitive)
                const matchingCompVar = compVars.find(
                  cv => cv.size?.toLowerCase() === bundleVar.size?.toLowerCase() && 
                        cv.color?.toLowerCase() === bundleVar.color?.toLowerCase()
                );
                if (matchingCompVar) {
                  linksToInsert.push({
                    bundle_variant_id: bundleVar.id,
                    component_variant_id: matchingCompVar.id,
                  });
                }
              }
            }

            if (linksToInsert.length > 0) {
              await supabase.from('bundle_variant_links').insert(linksToInsert);
            }
          }
        }
      }

      toast({
        title: isEditing ? 'Produto atualizado' : 'Produto criado',
        description: isEditing 
          ? 'As alterações foram salvas com sucesso.'
          : 'O produto foi criado com sucesso.',
      });

      navigate('/admin/produtos');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  function addVariant() {
    const defaultColor = colorOptions.length > 0 ? colorOptions[0] : null;
    setVariants([
      ...variants,
      {
        size: 'M',
        color: defaultColor?.name || 'Preto',
        color_hex: defaultColor?.hex_code || '#000000',
        sku: `${slug}-M-${(defaultColor?.name || 'PRETO').toUpperCase()}`.toUpperCase(),
        price: null,
        stock: 0,
        is_active: true,
      },
    ]);
  }

  function updateVariant(index: number, field: keyof Variant | Partial<Variant>, value?: any) {
    const updated = [...variants];
    
    // If field is an object, merge multiple fields at once
    if (typeof field === 'object') {
      updated[index] = { ...updated[index], ...field };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    // Auto-generate SKU when size or color changes
    if ((typeof field === 'object' && ('size' in field || 'color' in field)) || 
        (typeof field === 'string' && (field === 'size' || field === 'color'))) {
      const colorSlug = updated[index].color.toUpperCase().replace(/\s+/g, '-');
      updated[index].sku = `${slug}-${updated[index].size}-${colorSlug}`.toUpperCase();
    }

    setVariants(updated);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newImages: ProductImage[] = Array.from(files).map((file, i) => ({
      url: URL.createObjectURL(file),
      is_primary: images.length === 0 && i === 0,
      display_order: images.length + i,
      file,
    }));

    setImages([...images, ...newImages]);
  }

  function setPrimaryImage(index: number) {
    setImages(images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    })));
  }

  function removeImage(index: number) {
    const wasPrimary = images[index].is_primary;
    const filtered = images.filter((_, i) => i !== index);
    
    if (wasPrimary && filtered.length > 0) {
      filtered[0].is_primary = true;
    }
    
    setImages(filtered);
  }

  function toggleTag(tagId: string) {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }

  function addBenefit() {
    setBenefits([...benefits, '']);
  }

  function updateBenefit(index: number, value: string) {
    const updated = [...benefits];
    updated[index] = value;
    setBenefits(updated);
  }

  function removeBenefit(index: number) {
    setBenefits(benefits.filter((_, i) => i !== index));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/produtos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-semibold">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do produto *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Legging Compression"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="legging-compression"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Descrição curta</Label>
                  <Input
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Breve descrição do produto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição completa</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição detalhada do produto..."
                    rows={5}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Preço original (promocional)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      step="0.01"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={`Imagem ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      {img.is_primary && (
                        <Badge className="absolute top-2 left-2 text-xs">
                          Principal
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        {!img.is_primary && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setPrimaryImage(index)}
                          >
                            Principal
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => removeImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Variações</CardTitle>
                  <CardDescription>Tamanhos, cores e estoque de cada variação</CardDescription>
                </div>
                <Button type="button" size="sm" onClick={addVariant} disabled={isBundle}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle Conjunto */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="isBundle" className="font-medium">Este produto é um Conjunto</Label>
                      <p className="text-sm text-muted-foreground">
                        O estoque será calculado automaticamente baseado nos componentes
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="isBundle"
                    checked={isBundle}
                    onCheckedChange={handleBundleToggle}
                  />
                </div>

                {/* Seleção de componentes quando é conjunto */}
                {isBundle && (
                  <div className="p-4 border rounded-lg space-y-4 bg-accent/10">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      <Label className="font-medium">Componentes do Conjunto</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selecione os produtos que compõem este conjunto. O estoque de cada variação será 
                      o mínimo entre os estoques das variações correspondentes (mesmo tamanho e cor).
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {availableProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedComponentIds.includes(product.id) 
                              ? 'border-primary bg-primary/5' 
                              : 'hover:border-muted-foreground/50'
                          }`}
                          onClick={() => {
                            setSelectedComponentIds(prev => 
                              prev.includes(product.id)
                                ? prev.filter(id => id !== product.id)
                                : [...prev, product.id]
                            );
                          }}
                        >
                          <Checkbox 
                            checked={selectedComponentIds.includes(product.id)}
                            onCheckedChange={() => {}}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.variants?.length || 0} variações
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedComponentIds.length > 0 && (
                      <div className="pt-2">
                        <Badge variant="secondary">
                          {selectedComponentIds.length} componente{selectedComponentIds.length > 1 ? 's' : ''} selecionado{selectedComponentIds.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de variações */}
                {variants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma variação cadastrada. Adicione tamanhos e cores.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant, index) => {
                      // Calculate stock using the callback function
                      const calculatedStock = calculateBundleStock(variant.size, variant.color);

                      return (
                        <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                          <div className="flex-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                            <div className="space-y-2">
                              <Label>Tamanho</Label>
                              <Select
                                value={variant.size}
                                onValueChange={(v) => updateVariant(index, 'size', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SIZES.map((size) => (
                                    <SelectItem key={size} value={size}>{size}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Cor</Label>
                              <Select
                                value={variant.color}
                                onValueChange={(v) => {
                                  const colorObj = colorOptions.find(c => c.name === v);
                                  if (colorObj) {
                                    updateVariant(index, { color: v, color_hex: colorObj.hex_code });
                                  } else {
                                    updateVariant(index, 'color', v);
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border"
                                      style={{ backgroundColor: variant.color_hex || '#000000' }}
                                    />
                                    <span>{variant.color}</span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  {colorOptions.map((color) => (
                                    <SelectItem key={color.id} value={color.name}>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="w-4 h-4 rounded-full border"
                                          style={{ backgroundColor: color.hex_code }}
                                        />
                                        {color.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Cor (Hex)</Label>
                              <div className="flex gap-2">
                                <input
                                  type="color"
                                  value={variant.color_hex || '#000000'}
                                  onChange={(e) => updateVariant(index, 'color_hex', e.target.value)}
                                  className="w-10 h-10 rounded border cursor-pointer"
                                  title="Escolher cor"
                                />
                                <Input
                                  value={variant.color_hex || ''}
                                  onChange={(e) => updateVariant(index, 'color_hex', e.target.value)}
                                  placeholder="#000000"
                                  className="flex-1 font-mono text-sm"
                                  maxLength={7}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>SKU</Label>
                              <Input
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Estoque</Label>
                              {isBundle && selectedComponentIds.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={calculatedStock ?? 0}
                                      disabled
                                      className="bg-muted"
                                    />
                                    <Badge 
                                      variant={calculatedStock === 0 ? "destructive" : "outline"} 
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {calculatedStock === 0 ? "Sem estoque" : "Auto"}
                                    </Badge>
                                  </div>
                                  {calculatedStock === 0 && (
                                    <p className="text-xs text-destructive">
                                      Verifique se os componentes têm variações {variant.size}/{variant.color}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  min="0"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                />
                              )}
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Benefícios</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addBenefit}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        placeholder="Ex: Tecido de alta compressão"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBenefit(index)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Produto ativo</Label>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Badge</Label>
                  <Select value={badge || 'none'} onValueChange={(v) => setBadge(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="mais-vendido">Mais Vendido</SelectItem>
                      <SelectItem value="promo">Promoção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Guia de Tamanhos</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={sizeGuide}
                  onChange={(e) => setSizeGuide(e.target.value)}
                  placeholder="Instruções sobre tamanhos..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/produtos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Produto')}
          </Button>
        </div>
      </form>
    </div>
  );
}
