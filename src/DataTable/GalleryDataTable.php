<?php

namespace AmzsCMS\GalleryBundle\DataTable;

use AmzsCMS\CoreBundle\Service\Datatable\BaseDataTable;
use AmzsCMS\GalleryBundle\Entity\Gallery;
use AmzsCMS\GalleryBundle\Repository\GalleryRepository;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\HttpFoundation\Request;

class GalleryDataTable extends BaseDataTable
{
    protected $entityAlias = 'gallery';
    public function __construct(GalleryRepository $repository)
    {
        parent::__construct($repository);
    }

    // ================== Tùy chỉnh QueryBuil   der từ đầu (nếu cần JOIN) ==================
    protected function createBaseQueryBuilder(): QueryBuilder
    {
        return $this->repository
            ->createQueryBuilder('gallery')

            ->where('gallery.type = :type')
            ->andWhere('gallery.parent IS NULL')

            ->setParameter('type', 'folder')

            ->orderBy('gallery.lft', 'ASC');
    }
    protected function applyCustomFilters(QueryBuilder $qb, Request $request): void
    {

    }

    protected function getColumnMap(): array
    {
        return [
            0 => 'id',
//            1 => 'name',
//            2 => 'url',
//            3 => 'language',
        ];
    }

    protected function getSearchableFields(): array
    {
        return ['name'];
    }

    protected function formatData(array $entities): array
    {
        $data = [];
        /** @var Gallery $gallery */
        foreach ($entities as $index => $gallery) {
            $data[] = [
                'index'       => $index + 1,
                'id'       => $gallery->getId(),
                'parent'    => $gallery->getParent(),
                'name'    => $gallery->getName(),
                'created_at' => $gallery->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $gallery->getUpdatedAt()->format('Y-m-d H:i:s'),
            ];
        }
        return $data;
    }
}