import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
}

interface Variant {
  id: string;
  size: string;
  color: string;
  color_hex: string | null;
  stock: number;
  product_id: string;
}

interface VariantLink {
  bundle_variant_id: string;
  component_variant_id: string;
}

export default function BundleForm() {
  const navigate = useNavigate();
  const { bundleProductId } = useParams();
  const isEditing = !!bundleProductId;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBundleProduct, setSelectedBundleProduct] = useState<string>('');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [bundleVariants, setBundleVariants] = useState<Variant[]>([]);
  const [componentVariants, setComponentVariants] = useState<Record<string, Variant[]>>({});
  const [variantLinks, setVariantLinks] = useState<VariantLink[]>([]);
  const [existingLinks, setExistingLinks] = useState<VariantLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        toast.error('Erro ao carregar produtos');
        return;
      }

      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Load existing bundle data if editing
  useEffect(() => {
    if (!isEditing || !bundleProductId) return;

    const loadExistingBundle = async () => {
      try {
        // Get bundle product components
        const { data: bundleData, error: bundleError } = await supabase
          .from('product_bundles')
          .select('component_product_id')
          .eq('bundle_product_id', bundleProductId);

        if (bundleError) throw bundleError;

        setSelectedBundleProduct(bundleProductId);
        setSelectedComponents(bundleData?.map(b => b.component_product_id) || []);

        // Get existing variant links
        const { data: bundleVariantsData } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', bundleProductId);

        if (bundleVariantsData?.length) {
          const { data: linksData } = await supabase
            .from('bundle_variant_links')
            .select('bundle_variant_id, component_variant_id')
            .in('bundle_variant_id', bundleVariantsData.map(v => v.id));

          if (linksData) {
            setExistingLinks(linksData);
            setVariantLinks(linksData);
          }
        }
      } catch (error) {
        console.error('Error loading bundle:', error);
        toast.error('Erro ao carregar dados do conjunto');
      }
    };

    loadExistingBundle();
  }, [isEditing, bundleProductId]);

  // Fetch variants when bundle product is selected
  useEffect(() => {
    if (!selectedBundleProduct) {
      setBundleVariants([]);
      return;
    }

    const fetchBundleVariants = async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, size, color, color_hex, stock, product_id')
        .eq('product_id', selectedBundleProduct)
        .order('size');

      if (error) {
        console.error('Error fetching bundle variants:', error);
        return;
      }

      setBundleVariants(data || []);
    };

    fetchBundleVariants();
  }, [selectedBundleProduct]);

  // Fetch variants when components are selected
  useEffect(() => {
    if (selectedComponents.length === 0) {
      setComponentVariants({});
      return;
    }

    const fetchComponentVariants = async () => {
      const variants: Record<string, Variant[]> = {};

      for (const productId of selectedComponents) {
        const { data, error } = await supabase
          .from('product_variants')
          .select('id, size, color, color_hex, stock, product_id')
          .eq('product_id', productId)
          .order('size');

        if (!error && data) {
          variants[productId] = data;
        }
      }

      setComponentVariants(variants);
    };

    fetchComponentVariants();
  }, [selectedComponents]);

  const toggleComponent = (productId: string) => {
    setSelectedComponents(prev => {
      if (prev.includes(productId)) {
        // Remove component and its variant links
        setVariantLinks(links => 
          links.filter(link => {
            const componentVariantIds = componentVariants[productId]?.map(v => v.id) || [];
            return !componentVariantIds.includes(link.component_variant_id);
          })
        );
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const toggleVariantLink = (bundleVariantId: string, componentVariantId: string) => {
    setVariantLinks(prev => {
      const exists = prev.some(
        link => link.bundle_variant_id === bundleVariantId && link.component_variant_id === componentVariantId
      );

      if (exists) {
        return prev.filter(
          link => !(link.bundle_variant_id === bundleVariantId && link.component_variant_id === componentVariantId)
        );
      }

      return [...prev, { bundle_variant_id: bundleVariantId, component_variant_id: componentVariantId }];
    });
  };

  const isVariantLinked = (bundleVariantId: string, componentVariantId: string) => {
    return variantLinks.some(
      link => link.bundle_variant_id === bundleVariantId && link.component_variant_id === componentVariantId
    );
  };

  const getVariantLabel = (variant: Variant) => {
    const colorName = variant.color || 'Sem cor';
    return `${variant.size} - ${colorName}`;
  };

  const handleSave = async () => {
    if (!selectedBundleProduct) {
      toast.error('Selecione o produto conjunto');
      return;
    }

    if (selectedComponents.length === 0) {
      toast.error('Adicione pelo menos um componente');
      return;
    }

    setSaving(true);

    try {
      // If editing, delete existing bundle entries first
      if (isEditing) {
        await supabase
          .from('product_bundles')
          .delete()
          .eq('bundle_product_id', bundleProductId);
      }

      // Create bundle entries for each component
      const bundleEntries = selectedComponents.map(componentId => ({
        bundle_product_id: selectedBundleProduct,
        component_product_id: componentId,
      }));

      const { error: bundleError } = await supabase
        .from('product_bundles')
        .insert(bundleEntries);

      if (bundleError) throw bundleError;

      // Handle variant links
      if (bundleVariants.length > 0) {
        // Delete existing links for this bundle's variants
        await supabase
          .from('bundle_variant_links')
          .delete()
          .in('bundle_variant_id', bundleVariants.map(v => v.id));

        // Insert new links
        if (variantLinks.length > 0) {
          const { error: linksError } = await supabase
            .from('bundle_variant_links')
            .insert(variantLinks);

          if (linksError) throw linksError;
        }
      }

      toast.success(isEditing ? 'Conjunto atualizado!' : 'Conjunto criado!');
      navigate('/admin/conjuntos');
    } catch (error) {
      console.error('Error saving bundle:', error);
      toast.error('Erro ao salvar conjunto');
    } finally {
      setSaving(false);
    }
  };

  const availableComponents = products.filter(p => p.id !== selectedBundleProduct);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/conjuntos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-semibold">
            {isEditing ? 'Editar Conjunto' : 'Novo Conjunto'}
          </h1>
          <p className="text-muted-foreground">
            Configure quais produtos formam um conjunto e vincule suas variantes
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bundle Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Produto Conjunto</CardTitle>
            <CardDescription>
              Selecione o produto que representa o conjunto completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedBundleProduct}
              onValueChange={setSelectedBundleProduct}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto conjunto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedBundleProduct && bundleVariants.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm text-muted-foreground">Variantes do conjunto:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {bundleVariants.map((variant) => (
                    <Badge key={variant.id} variant="outline">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: variant.color_hex || '#ccc' }}
                      />
                      {getVariantLabel(variant)} ({variant.stock} em estoque)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Component Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes do Conjunto</CardTitle>
            <CardDescription>
              Selecione os produtos que fazem parte deste conjunto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBundleProduct ? (
              <p className="text-sm text-muted-foreground">
                Primeiro selecione o produto conjunto
              </p>
            ) : (
              <div className="space-y-3">
                {availableComponents.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent"
                    onClick={() => toggleComponent(product.id)}
                  >
                    <Checkbox
                      checked={selectedComponents.includes(product.id)}
                      onCheckedChange={() => toggleComponent(product.id)}
                    />
                    <span className="flex-1">{product.name}</span>
                    {selectedComponents.includes(product.id) && (
                      <Badge variant="secondary">
                        <Check className="h-3 w-3 mr-1" />
                        Selecionado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variant Linking Section */}
      {selectedBundleProduct && selectedComponents.length > 0 && bundleVariants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Vincular Variantes
            </CardTitle>
            <CardDescription>
              Conecte cada variante do conjunto às variantes correspondentes dos componentes.
              <br />
              <span className="text-amber-600">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Variantes não vinculadas não terão estoque sincronizado.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {bundleVariants.map((bundleVariant) => (
                <div key={bundleVariant.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: bundleVariant.color_hex || '#ccc' }}
                    />
                    <span className="font-medium">
                      Conjunto {getVariantLabel(bundleVariant)}
                    </span>
                    <Badge variant="outline">{bundleVariant.stock} em estoque</Badge>
                  </div>

                  <div className="pl-6 space-y-2">
                    {selectedComponents.map((componentId) => {
                      const componentProduct = products.find(p => p.id === componentId);
                      const variants = componentVariants[componentId] || [];

                      return (
                        <div key={componentId} className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            {componentProduct?.name}:
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {variants.map((compVariant) => {
                              const isLinked = isVariantLinked(bundleVariant.id, compVariant.id);
                              return (
                                <Badge
                                  key={compVariant.id}
                                  variant={isLinked ? 'default' : 'outline'}
                                  className="cursor-pointer transition-colors"
                                  onClick={() => toggleVariantLink(bundleVariant.id, compVariant.id)}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full mr-2"
                                    style={{ backgroundColor: compVariant.color_hex || '#ccc' }}
                                  />
                                  {getVariantLabel(compVariant)}
                                  {isLinked && <Check className="ml-1 h-3 w-3" />}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary and Save */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {variantLinks.length} vínculo(s) de variantes configurado(s)
              </p>
              {variantLinks.length === 0 && selectedBundleProduct && selectedComponents.length > 0 && (
                <p className="text-sm text-amber-600">
                  Configure os vínculos de variantes para sincronização de estoque
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/admin/conjuntos')}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Conjunto'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
